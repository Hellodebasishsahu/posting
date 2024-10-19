// function getMediaDetailsFromDrive(fileId) {
//     try {
//         const file = DriveApp.getFileById(fileId);
//         const metadata = {
//             name: file.getName(),
//             mimeType: file.getMimeType(),
//             size: file.getSize(), // File size in bytes
//             duration: getVideoDuration(fileId), // Helper function to get duration
//         };
        
//         // Determine if it's likely a Reel or a regular video
//         const isReel = checkIfReel(metadata);
//         Logger.log(`File: ${metadata.name}, Type: ${isReel ? 'Reel' : 'Normal Video'}`);
        
//         return isReel ? 'REEL' : 'NORMAL_VIDEO';
//     } catch (error) {
//         Logger.log(`Error getting media details for fileId ${fileId}: ${error.message}`);
//         throw error;
//     }
// }

// // Helper function to get video duration using Drive's export format (e.g., if it contains metadata)
// function getVideoDuration(fileId) {
//     const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=videoMediaMetadata`;
//     const response = UrlFetchApp.fetch(url, {
//         method: 'GET',
//         headers: {
//             Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
//         },
//     });
//     const metadata = JSON.parse(response.getContentText());
//     return metadata.videoMediaMetadata ? metadata.videoMediaMetadata.durationMillis / 1000 : null;
// }

// // Helper function to determine if the video is a Reel
// function checkIfReel(metadata) {
//     const maxReelDuration = 90; // Max duration for Reels in seconds
//     const aspectRatioReel = 9 / 16;

//     // Example logic: If the video is portrait and less than 90s, treat it as a Reel
//     return (
//         metadata.duration && metadata.duration <= maxReelDuration &&
//         isPortrait(metadata.mimeType)
//     );
// }

// // Placeholder function to check aspect ratio from MIME type or metadata (if available)
// function isPortrait(mimeType) {
//     // Add more refined checks if necessary
//     return mimeType.includes('video');
// }