// // Helper function to encode parameters
// function encodeParams(params) {
//   return Object.keys(params)
//     .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
//     .join('&');
// }

// async function batchRequest(requests, accessToken) {
//   const url = 'https://graph.facebook.com/v20.0/';
//   const batchSize = 50; // Meta allows max 50 requests per batch
//   const batches = [];
  
//   // Split requests into batches of 50
//   for (let i = 0; i < requests.length; i += batchSize) {
//     const batchRequests = requests.slice(i, i + batchSize).map(req => ({
//       method: req.method,
//       relative_url: req.relative_url,
//       body: req.body ? encodeParams(req.body) : undefined,
//       headers: req.headers
//     }));

//     const payload = {
//       access_token: accessToken,
//       batch: JSON.stringify(batchRequests),
//       include_headers: false
//     };

//     logStep('batchRequest', `Outgoing payload: ${JSON.stringify(payload)}`);

//     const response = await UrlFetchApp.fetch(url, {
//       method: 'POST',
//       payload: payload,
//       muteHttpExceptions: true
//     });

//     const responseText = response.getContentText();
//     logStep('batchRequest', `Incoming response: ${responseText}`);

//     const batchResults = JSON.parse(responseText);
//     batches.push(...batchResults);
//   }

//   return batches;
// }

// async function processInstagramBatch(batch) {
//   logStep('processInstagramBatch', `Processing ${batch.length} Instagram items`);
//   const imageBatch = batch.filter(item => item.mediaType === 'IMAGE');
//   const reelBatch = batch.filter(item => ['REELS', 'VIDEO'].includes(item.mediaType));

//   // Step 1: Create media containers in batch
//   const createRequests = [
//     ...imageBatch.map(item => ({
//       method: 'POST',
//       relative_url: `${item.accountId}/media`,
//       body: {
//         media_type: 'IMAGE',
//         image_url: item.mediaUrl,
//         caption: item.caption,
//         access_token: accessToken
//       }
//     })),
//     ...reelBatch.map(item => ({
//       method: 'POST',
//       relative_url: `${item.accountId}/media`,
//       body: {
//         media_type: 'REELS',
//         video_url: item.mediaUrl,
//         caption: item.caption,
//         access_token: accessToken
//       }
//     }))
//   ];

//   if (createRequests.length === 0) {
//     return [];
//   }

//   const createResults = await batchRequest(createRequests, accessToken);
//   const mediaIds = createResults.map(result => {
//     if (!result.body) {
//       throw new Error(`Invalid response from media creation: ${JSON.stringify(result)}`);
//     }
//     const data = JSON.parse(result.body);
//     if (!data.id) {
//       throw new Error(`Failed to create media: ${JSON.stringify(data)}`);
//     }
//     return data.id;
//   });

//   // Step 2: Publish all media in batch
//   const publishRequests = mediaIds.map((mediaId, index) => ({
//     method: 'POST',
//     relative_url: `${batch[index].accountId}/media_publish`,
//     body: {
//       creation_id: mediaId,
//       access_token: accessToken
//     }
//   }));

//   const publishResults = await batchRequest(publishRequests, accessToken);

//   // Update sheet statuses
//   await Promise.all(publishResults.map(async (result, index) => {
//     try {
//       if (!result.body) {
//         throw new Error(`Invalid publish response: ${JSON.stringify(result)}`);
//       }
//       const data = JSON.parse(result.body);
//       if (!data.id) {
//         throw new Error(`Failed to publish media: ${JSON.stringify(data)}`);
//       }
//       const postType = batch[index].mediaType === 'REELS' ? 'reel' : 'p';
//       await updateSheetStatus(
//         'instagram', 
//         batch[index].row, 
//         `Posted successfully: https://www.instagram.com/${postType}/${data.id}`
//       );
//     } catch (error) {
//       await updateSheetStatus(
//         'instagram',
//         batch[index].row,
//         `Error publishing: ${error.message}`
//       );
//       throw error;
//     }
//   }));

//   return publishResults;
// }

// async function processFacebookBatch(batch) {
//   logStep('processFacebookBatch', `Processing ${batch.length} Facebook items`);
//   const imageBatch = batch.filter(item => item.mediaType === 'IMAGE');
//   const videoBatch = batch.filter(item => item.mediaType === 'VIDEO');
//   const reelBatch = batch.filter(item => item.mediaType === 'REELS');

//   // Process images in batch
//   const imageRequests = imageBatch.map(item => ({
//     method: 'POST',
//     relative_url: `${item.pageId}/photos`,
//     body: {
//       url: item.mediaUrl,
//       caption: item.caption,
//       access_token: item.accessToken
//     }
//   }));

//   // Process videos in batch
//   const videoRequests = videoBatch.map(item => ({
//     method: 'POST',
//     relative_url: `${item.pageId}/videos`,
//     body: {
//       file_url: item.mediaUrl,
//       description: item.caption,
//       access_token: item.accessToken
//     }
//   }));

//   // Process reels in three steps
//   // Step 1: Create containers
//   const reelContainerRequests = reelBatch.map(item => ({
//     method: 'POST',
//     relative_url: `${item.pageId}/video_reels`,
//     body: {
//       upload_phase: 'start',
//       access_token: item.accessToken
//     }
//   }));

//   // Execute all batches
//   const [imageResults, videoResults, reelContainerResults] = await Promise.all([
//     imageRequests.length > 0 ? batchRequest(imageRequests, accessToken) : [],
//     videoRequests.length > 0 ? batchRequest(videoRequests, accessToken) : [],
//     reelBatch.length > 0 ? batchRequest(reelContainerRequests, accessToken) : []
//   ]);

//   // For reels, process upload and publish phases
//   if (reelBatch.length > 0) {
//     const videoIds = reelContainerResults.map(result => {
//       if (!result.body) {
//         throw new Error(`Invalid container response: ${JSON.stringify(result)}`);
//       }
//       const data = JSON.parse(result.body);
//       if (!data.video_id) {
//         throw new Error(`Failed to create reel container: ${JSON.stringify(data)}`);
//       }
//       return data.video_id;
//     });
    
//     // Step 2: Upload videos (this needs to be sequential due to upload requirements)
//     const uploadPromises = reelBatch.map(async (item, index) => {
//       const videoId = videoIds[index];
//       const uploadUrl = `https://rupload.facebook.com/video-upload/v21.0/${videoId}`;
//       const uploadResponse = await UrlFetchApp.fetch(uploadUrl, {
//         method: 'POST',
//         headers: {
//           'Authorization': `OAuth ${item.accessToken}`,
//           'file_url': item.mediaUrl
//         },
//         muteHttpExceptions: true
//       });
      
//       const uploadResult = JSON.parse(uploadResponse.getContentText());
//       if (!uploadResult.success) {
//         throw new Error(`Failed to upload video: ${JSON.stringify(uploadResult)}`);
//       }
      
//       return videoId;
//     });

//     await Promise.all(uploadPromises);

//     // Step 3: Finish and publish reels in batch
//     const publishRequests = reelBatch.map((item, index) => ({
//       method: 'POST',
//       relative_url: `${item.pageId}/video_reels`,
//       body: {
//         video_id: videoIds[index],
//         upload_phase: 'finish',
//         video_state: 'PUBLISHED',
//         description: item.caption,
//         access_token: item.accessToken
//       }
//     }));

//     const publishResults = await batchRequest(publishRequests, accessToken);
    
//     // Update statuses for reels
//     await Promise.all(reelBatch.map(async (item, index) => {
//       try {
//         if (!publishResults[index].body) {
//           throw new Error(`Invalid publish response: ${JSON.stringify(publishResults[index])}`);
//         }
//         const result = JSON.parse(publishResults[index].body);
//         if (!result.success) {
//           throw new Error(`Failed to publish reel: ${JSON.stringify(result)}`);
//         }
//         await updateSheetStatus(
//           'facebook',
//           item.row,
//           `Reel posted successfully: video_id=${videoIds[index]}`
//         );
//       } catch (error) {
//         await updateSheetStatus(
//           'facebook',
//           item.row,
//           `Error publishing reel: ${error.message}`
//         );
//         throw error;
//       }
//     }));
//   }

//   // Update statuses for images and videos
//   await Promise.all([
//     ...imageBatch.map(async (item, index) => {
//       try {
//         if (!imageResults[index].body) {
//           throw new Error(`Invalid image response: ${JSON.stringify(imageResults[index])}`);
//         }
//         const result = JSON.parse(imageResults[index].body);
//         if (!result.id) {
//           throw new Error(`Failed to post image: ${JSON.stringify(result)}`);
//         }
//         await updateSheetStatus(
//           'facebook',
//           item.row,
//           `Posted successfully: https://www.facebook.com/${result.id}`
//         );
//       } catch (error) {
//         await updateSheetStatus(
//           'facebook',
//           item.row,
//           `Error posting image: ${error.message}`
//         );
//         throw error;
//       }
//     }),
//     ...videoBatch.map(async (item, index) => {
//       try {
//         if (!videoResults[index].body) {
//           throw new Error(`Invalid video response: ${JSON.stringify(videoResults[index])}`);
//         }
//         const result = JSON.parse(videoResults[index].body);
//         if (!result.id) {
//           throw new Error(`Failed to post video: ${JSON.stringify(result)}`);
//         }
//         await updateSheetStatus(
//           'facebook',
//           item.row,
//           `Video posted successfully: https://www.facebook.com/${result.id}`
//         );
//       } catch (error) {
//         await updateSheetStatus(
//           'facebook',
//           item.row,
//           `Error posting video: ${error.message}`
//         );
//         throw error;
//       }
//     })
//   ]);

//   return {
//     imageResults,
//     videoResults,
//     reelResults: reelContainerResults
//   };
// }

// function logStep(step, details) {
//     console.log(`[${step}] ${details}`);
// }

// async function updateSheetStatus(platform, row, status) {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//   const column = platform.toLowerCase() === 'facebook' ? 12 : 13;
  
//   logStep('updateSheetStatus', `Updating ${platform} status for row ${row}: ${status}`);
  
//   try {
//     sheet.getRange(row, column).setValue(status);
//     logStep('updateSheetStatus', `Status updated successfully`);
//   } catch (error) {
//     logStep('updateSheetStatus', `Error updating status: ${error.message}`);
//   }
// }

// async function postToSocialMedia() {
//   console.time("postToSocialMedia");
//   logStep('postToSocialMedia', "Starting postToSocialMedia function");

//   if (!businessId || !accessToken) {
//     throw new Error("Business ID or Access Token is missing.");
//   }

//   const pages = await retryOperation(() => FacebookAPI.getPages(businessId, accessToken));
//   if (!pages || pages.length === 0) {
//     throw new Error("No pages found or an error occurred.");
//   }

//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//   const data = sheet.getDataRange().getValues();

//   const instagramBatch = [];
//   const facebookBatch = [];

//   sheet.getRange(2, 12, sheet.getLastRow() - 1, 2).clearContent();

//   for (let i = 1; i < data.length; i++) {
//     const [, , caption, mediaUrl, mediaType, , facebookPageId, instagramAccountId, , facebookTickbox, instagramTickbox] = data[i];
    
//     logStep('postToSocialMedia', `Row ${i + 1}: mediaUrl=${mediaUrl}, mediaType=${mediaType}, facebookTickbox=${facebookTickbox}, instagramTickbox=${instagramTickbox}, facebookPageId=${facebookPageId}, instagramAccountId=${instagramAccountId}`);
    
//     if (!mediaUrl) {
//       await updateSheetStatus('facebook', i + 1, "Media URL is missing");
//       await updateSheetStatus('instagram', i + 1, "Media URL is missing");
//       continue;
//     }

//     const upperMediaType = mediaType.toUpperCase();
    
//     if (instagramTickbox && instagramAccountId && ['IMAGE', 'REELS', 'VIDEO'].includes(upperMediaType)) {
//       instagramBatch.push({ accountId: instagramAccountId, mediaUrl, caption, row: i + 1, mediaType: upperMediaType });
//     } else if (instagramTickbox && !instagramAccountId) {
//       await updateSheetStatus('instagram', i + 1, "Instagram Account ID is missing");
//     }

//     if (facebookTickbox && facebookPageId) {
//       const page = pages.find(p => p.id === facebookPageId.toString());
//       if (page) {
//         facebookBatch.push({ pageId: page.id, accessToken: page.access_token, mediaUrl, caption, row: i + 1, mediaType: upperMediaType });
//       } else {
//         await updateSheetStatus('facebook', i + 1, "Facebook page not found");
//       }
//     } else if (facebookTickbox && !facebookPageId) {
//       await updateSheetStatus('facebook', i + 1, "Facebook Page ID is missing");
//     }
//   }

//   logStep('postToSocialMedia', `Number of Instagram rows to process: ${instagramBatch.length}`);
//   logStep('postToSocialMedia', `Number of Facebook rows to process: ${facebookBatch.length}`);

//   // Process batches
//   try {
//     await Promise.all([
//       processInstagramBatch(instagramBatch),
//       processFacebookBatch(facebookBatch)
//     ]);
//     logStep('postToSocialMedia', "All batches processed successfully");
//   } catch (error) {
//     logStep('postToSocialMedia', `Error processing batches: ${error.message}`);
//   } finally {
//     const elapsedTime = console.timeEnd("postToSocialMedia");
//     const totalPosts = instagramBatch.length + facebookBatch.length;
//     const avgTimePerPost = totalPosts > 0 ? elapsedTime / totalPosts : 0;
//     const minutes = Math.floor(elapsedTime / 60000);
//     const seconds = ((elapsedTime % 60000) / 1000).toFixed(0);
//     const avgMinutes = Math.floor(avgTimePerPost / 60000);
//     const avgSeconds = ((avgTimePerPost % 60000) / 1000).toFixed(0);
//     logStep('postToSocialMedia', `Elapsed time: ${minutes} minutes and ${seconds} seconds`);
//     logStep('postToSocialMedia', `Average time per post: ${avgMinutes} minutes and ${avgSeconds} seconds`);
//   }
// }

// const FacebookAPI = {
//   getPages: async function(businessId, accessToken) {
//     logStep('getPages', `Fetching pages for business: businessId=${businessId}`);
//     let pages = [];
//     let url = `https://graph.facebook.com/v20.0/${businessId}/owned_pages?access_token=${encodeURIComponent(accessToken)}&fields=id,access_token,name&limit=100`;

//     while (url) {
//       const response = await UrlFetchApp.fetch(url, { 'muteHttpExceptions': true });
//       const jsonResponse = JSON.parse(response.getContentText());
      
//       if (jsonResponse.data) {
//         pages = pages.concat(jsonResponse.data.map(page => ({
//           id: page.id,
//           name: page.name,
//           access_token: page.access_token
//         })));
//       } else {
//         throw new Error("Failed to fetch pages: " + response.getContentText());
//       }

//       url = jsonResponse.paging && jsonResponse.paging.next ? jsonResponse.paging.next : null;
//     }

//     return pages;
//   }
// };

// async function retryOperation(operation, maxRetries = 3, retryInterval = 5000) {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       return await operation();
//     } catch (error) {
//       if (attempt === maxRetries) throw error;
//       logStep('retryOperation', `Attempt ${attempt} failed: ${error.message}. Retrying in ${retryInterval / 1000} seconds...`);
//       await new Promise(resolve => Utilities.sleep(retryInterval));
//     }
//   }
// }