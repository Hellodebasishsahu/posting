// // Helper function for cooldown
// function createCooldownManager() {
//   const cooldowns = {};
//   return {
//     wait: async function(key, duration) {
//       const now = Date.now();
//       if (cooldowns[key] && now < cooldowns[key]) {
//         const waitTime = cooldowns[key] - now;
//         await Utilities.sleep(waitTime);
//       }
//       cooldowns[key] = Date.now() + duration;
//     }
//   };
// }

// const cooldownManager = createCooldownManager();

// async function processInstagramBatch(batch) {
//   logStep('processInstagramBatch', `Processing ${batch.length} Instagram items`);
//   const results = [];

//   for (const item of batch) {
//     try {
//       await cooldownManager.wait('instagram', 10000); // 10-second cooldown

//       const createRequest = {
//         method: 'POST',
//         relative_url: `${item.accountId}/media`,
//         body: {
//           media_type: item.mediaType === 'IMAGE' ? 'IMAGE' : 'REELS',
//           [item.mediaType === 'IMAGE' ? 'image_url' : 'video_url']: item.mediaUrl,
//           caption: item.caption,
//           access_token: accessToken
//         }
//       };

//       const [createResult] = await batchRequest([createRequest], accessToken);
      
//       if (!createResult.body) {
//         throw new Error(`Invalid response from media creation: ${JSON.stringify(createResult)}`);
//       }
//       const createData = JSON.parse(createResult.body);
//       if (!createData.id) {
//         throw new Error(`Failed to create media: ${JSON.stringify(createData)}`);
//       }

//       const publishRequest = {
//         method: 'POST',
//         relative_url: `${item.accountId}/media_publish`,
//         body: {
//           creation_id: createData.id,
//           access_token: accessToken
//         }
//       };

//       const [publishResult] = await batchRequest([publishRequest], accessToken);

//       if (!publishResult.body) {
//         throw new Error(`Invalid publish response: ${JSON.stringify(publishResult)}`);
//       }
//       const publishData = JSON.parse(publishResult.body);
//       if (!publishData.id) {
//         throw new Error(`Failed to publish media: ${JSON.stringify(publishData)}`);
//       }

//       const postType = item.mediaType === 'REELS' ? 'reel' : 'p';
//       await updateSheetStatus(
//         'instagram', 
//         item.row, 
//         `Posted successfully: https://www.instagram.com/${postType}/${publishData.id}`
//       );
//       results.push(publishData);
//     } catch (error) {
//       await updateSheetStatus(
//         'instagram',
//         item.row,
//         `Error publishing: ${error.message}`
//       );
//       console.error(`Error processing Instagram item: ${error.message}`);
//       // Continue with the next item
//     }
//   }

//   return results;
// }

// async function processFacebookBatch(batch) {
//   logStep('processFacebookBatch', `Processing ${batch.length} Facebook items`);
//   const results = [];

//   for (const item of batch) {
//     try {
//       await cooldownManager.wait('facebook', 10000); // 10-second cooldown

//       let request;
//       if (item.mediaType === 'IMAGE') {
//         request = {
//           method: 'POST',
//           relative_url: `${item.pageId}/photos`,
//           body: {
//             url: item.mediaUrl,
//             caption: item.caption,
//             access_token: item.accessToken
//           }
//         };
//       } else if (item.mediaType === 'VIDEO' || item.mediaType === 'REELS') {
//         // For both VIDEO and REELS, use the video_reels endpoint
//         const containerRequest = {
//           method: 'POST',
//           relative_url: `${item.pageId}/video_reels`,
//           body: {
//             upload_phase: 'start',
//             access_token: item.accessToken
//           }
//         };

//         const [containerResult] = await batchRequest([containerRequest], accessToken);
//         if (!containerResult.body) {
//           throw new Error(`Invalid container response: ${JSON.stringify(containerResult)}`);
//         }
//         const containerData = JSON.parse(containerResult.body);
//         if (!containerData.video_id) {
//           throw new Error(`Failed to create video container: ${JSON.stringify(containerData)}`);
//         }

//         // Upload video
//         const uploadUrl = `https://rupload.facebook.com/video-upload/v21.0/${containerData.video_id}`;
//         const uploadResponse = await UrlFetchApp.fetch(uploadUrl, {
//           method: 'POST',
//           headers: {
//             'Authorization': `OAuth ${item.accessToken}`,
//             'file_url': item.mediaUrl
//           },
//           muteHttpExceptions: true
//         });

//         const uploadResult = JSON.parse(uploadResponse.getContentText());
//         if (!uploadResult.success) {
//           throw new Error(`Failed to upload video: ${JSON.stringify(uploadResult)}`);
//         }

//         // Publish video
//         request = {
//           method: 'POST',
//           relative_url: `${item.pageId}/video_reels`,
//           body: {
//             video_id: containerData.video_id,
//             upload_phase: 'finish',
//             video_state: 'PUBLISHED',
//             description: item.caption,
//             access_token: item.accessToken
//           }
//         };
//       }

//       const [result] = await batchRequest([request], accessToken);

//       if (!result.body) {
//         throw new Error(`Invalid response: ${JSON.stringify(result)}`);
//       }
//       const data = JSON.parse(result.body);
//       if (!data.id && !data.success) {
//         throw new Error(`Failed to post: ${JSON.stringify(data)}`);
//       }

//       let statusMessage;
//       if (item.mediaType === 'IMAGE') {
//         statusMessage = `Posted successfully: https://www.facebook.com/${data.id}`;
//       } else {
//         statusMessage = `Video/Reel posted successfully: id=${data.id || containerData.video_id}`;
//       }

//       await updateSheetStatus('facebook', item.row, statusMessage);
//       results.push(data);
//     } catch (error) {
//       await updateSheetStatus(
//         'facebook',
//         item.row,
//         `Error posting: ${error.message}`
//       );
//       console.error(`Error processing Facebook item: ${error.message}`);
//       // Continue with the next item
//     }
//   }

//   return results;
// }