import { gospelLibraryClient } from "../api/client.js";
import { MediaResult } from "../api/types.js";

interface FetchMediaArgs {
  uri: string;
  lang?: string;
  mediaType?: 'all' | 'audio' | 'video' | 'image';
  quality?: 'all' | '1080p' | '720p' | '360p';
}

export const fetchMediaTool = {
  definition: {
    name: "fetch_media",
    description: "Extract and fetch audio, video, and image media URLs from Gospel Library content",
    inputSchema: {
      type: "object",
      properties: {
        uri: {
          type: "string",
          description: "The URI of the content (e.g., '/general-conference/2024/10/15nelson')",
        },
        lang: {
          type: "string",
          description: "Language code (default: 'eng')",
          default: "eng",
        },
        mediaType: {
          type: "string",
          description: "Filter by media type (default: 'all')",
          enum: ["all", "audio", "video", "image"],
          default: "all",
        },
        quality: {
          type: "string",
          description: "Filter by video quality (default: 'all')",
          enum: ["all", "1080p", "720p", "360p"],
          default: "all",
        },
      },
      required: ["uri"],
    },
  },
  handler: async (args: FetchMediaArgs) => {
    const { uri, lang, mediaType = 'all', quality = 'all' } = args;
    
    const mediaResult = await gospelLibraryClient.fetchMediaInfo(uri, lang);
    
    if (!mediaResult) {
      return {
        content: [
          {
            type: "text",
            text: `No media content found for "${uri}". This content may not have associated audio, video, or image files.`,
          },
        ],
      };
    }

    // Filter media by type and quality if specified
    let filteredMedia = mediaResult.media;
    if (mediaType !== 'all') {
      filteredMedia = filteredMedia.filter(media => media.type === mediaType);
    }
    if (quality !== 'all') {
      filteredMedia = filteredMedia.filter(media => media.quality === quality);
    }

    if (filteredMedia.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No ${mediaType} media found for "${uri}". Available media types: ${mediaResult.media.map(m => m.type).join(', ')}.`,
          },
        ],
      };
    }

    let result = `# Media Content: ${mediaResult.title}\n\n`;
    
    if (mediaResult.speaker) {
      result += `**Speaker:** ${mediaResult.speaker}\n`;
    }
    
    if (mediaResult.date) {
      result += `**Date:** ${mediaResult.date}\n`;
    }
    
    if (mediaResult.description) {
      result += `**Description:** ${mediaResult.description}\n`;
    }
    
    result += `\n---\n\n`;

    // Group media by type
    const audioMedia = filteredMedia.filter(m => m.type === 'audio');
    const videoMedia = filteredMedia.filter(m => m.type === 'video');
    const imageMedia = filteredMedia.filter(m => m.type === 'image');

    if (audioMedia.length > 0) {
      result += `## 🎵 Audio Content (${audioMedia.length})\n\n`;
      audioMedia.forEach((media, index) => {
        result += `### Audio ${index + 1}\n`;
        result += `- **URL:** ${media.url}\n`;
        result += `- **Format:** ${(media.format || 'unknown').toUpperCase()}\n`;
        if (media.quality) result += `- **Quality:** ${media.quality}\n`;
        if (media.language) result += `- **Language:** ${media.language.toUpperCase()}\n`;
        if (media.duration) result += `- **Duration:** ${media.duration}\n`;
        if (media.size) result += `- **Size:** ${media.size}\n`;
        if (media.downloadUrl) result += `- **Download:** ${media.downloadUrl}\n`;
        result += `\n`;
      });
    }

    if (videoMedia.length > 0) {
      result += `## 🎥 Video Content (${videoMedia.length})\n\n`;
      
      // Group videos by quality for better organization
      const videosByQuality = videoMedia.reduce((acc, media) => {
        const q = media.quality || 'unknown';
        if (!acc[q]) acc[q] = [];
        acc[q].push(media);
        return acc;
      }, {} as Record<string, typeof videoMedia>);

      const qualityOrder = ['1080p', '720p', '360p', 'unknown'];
      qualityOrder.forEach(qualityLevel => {
        if (videosByQuality[qualityLevel]) {
          result += `### ${qualityLevel.toUpperCase()} Quality\n\n`;
          videosByQuality[qualityLevel].forEach((media, index) => {
            result += `**${media.format} Format:**\n`;
            result += `- **URL:** ${media.url}\n`;
            if (media.language) result += `- **Language:** ${media.language.toUpperCase()}\n`;
            if (media.duration) result += `- **Duration:** ${media.duration}\n`;
            if (media.size) result += `- **Size:** ${media.size}\n`;
            if (media.downloadUrl) result += `- **Download:** ${media.downloadUrl}\n`;
            result += `\n`;
          });
        }
      });
    }

    if (imageMedia.length > 0) {
      result += `## 🖼️ Image Content (${imageMedia.length})\n\n`;
      imageMedia.forEach((media, index) => {
        result += `### Image ${index + 1}\n`;
        result += `- **URL:** ${media.url}\n`;
        result += `- **Format:** ${(media.format || 'unknown').toUpperCase()}\n`;
        if (media.size) result += `- **Size:** ${media.size}\n`;
        result += `\n`;
      });
    }

    if (mediaResult.thumbnailUrl && !imageMedia.some(m => m.url === mediaResult.thumbnailUrl)) {
      result += `## 🏷️ Thumbnail\n\n`;
      result += `- **URL:** ${mediaResult.thumbnailUrl}\n\n`;
    }

    result += `## 💡 Usage Tips\n\n`;
    result += `- **Direct Access:** Copy any URL above to access the media directly\n`;
    result += `- **Download:** Most URLs support direct download by adding them to a browser\n`;
    result += `- **Streaming:** Audio and video URLs can typically be streamed in media players\n`;
    
    if (audioMedia.length > 0) {
      result += `- **Audio Player:** Use with your preferred audio application or browser\n`;
    }
    
    if (videoMedia.length > 0) {
      result += `- **Video Player:** Compatible with most video players and browsers\n`;
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
};