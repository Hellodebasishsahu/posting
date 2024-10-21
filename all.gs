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

// async function processInstagramBatch(batch) {
//   logStep('processInstagramBatch', `Processing ${batch.length} Instagram items`);
//   const imageBatch = batch.filter(item => item.mediaType.toUpperCase() === 'IMAGE');
//   const reelBatch = batch.filter(item => ['REELS', 'VIDEO'].includes(item.mediaType.toUpperCase()));
  
//   return Promise.all([
//     ...imageBatch.map(item => retryOperation(() => processInstagramMedia(item, 'IMAGE'))),
//     ...reelBatch.map(item => retryOperation(() => processInstagramMedia(item, 'REELS')))
//   ]);
// }

// async function processInstagramMedia(item, mediaType) {
//   // logStep('processInstagramMedia', `Processing Instagram ${mediaType} for row ${item.row}`);
  
//   const mediaResponse = await createInstagramMedia(item.accountId, item.mediaUrl, item.caption, mediaType);
//   if (!mediaResponse || !mediaResponse.id) throw new Error(`Failed to create Instagram ${mediaType}`);
  
//   // No sleep needed here as we're using the creation_id immediately
//   const publishResponse = await publishInstagramMedia(item.accountId, mediaResponse.id);
//   if (!publishResponse || !publishResponse.id) throw new Error(`Failed to publish Instagram ${mediaType}`);
  
//   const postType = mediaType === 'REELS' ? 'reel' : 'p';
//   await updateSheetStatus('instagram', item.row, `Posted successfully: https://www.instagram.com/${postType}/${publishResponse.id}`);
//   return publishResponse;
// }

// async function createInstagramMedia(accountId, mediaUrl, caption, mediaType) {
//   // logStep('createInstagramMedia', `Creating Instagram media: accountId=${accountId}, mediaType=${mediaType}`);
//   const url = `https://graph.facebook.com/v20.0/${accountId}/media`;
//   const payload = {
//     'access_token': accessToken,
//     'caption': caption,
//     'media_type': mediaType,
//     [mediaType === 'IMAGE' ? 'image_url' : 'video_url']: mediaUrl
//   };
  
//   const response = await UrlFetchApp.fetch(url, {
//     'method': 'post',
//     'payload': payload,
//     'muteHttpExceptions': true
//   });
  
//   const responseData = JSON.parse(response.getContentText());
//   logStep('createInstagramMedia', `Response: ${JSON.stringify(responseData)}`);
//   return responseData;
// }

// async function publishInstagramMedia(accountId, mediaId) {
//   logStep('publishInstagramMedia', `Publishing Instagram media: accountId=${accountId}, mediaId=${mediaId}`);
//   const url = `https://graph.facebook.com/v20.0/${accountId}/media_publish`;
//   const payload = {
//     'access_token': accessToken,
//     'creation_id': mediaId
//   };
  
//   const response = await UrlFetchApp.fetch(url, {
//     'method': 'post',
//     'payload': payload,
//     'muteHttpExceptions': true
//   });
  
//   const responseData = JSON.parse(response.getContentText());
//   logStep('publishInstagramMedia', `Response: ${JSON.stringify(responseData)}`);
//   return responseData;
// }

// // Facebook Functions
// async function processFacebookBatch(batch) {
//   logStep('processFacebookBatch', `Processing ${batch.length} Facebook items`);
//   const imageBatch = batch.filter(item => item.mediaType.toUpperCase() === 'IMAGE');
//   const videoBatch = batch.filter(item => item.mediaType.toUpperCase() === 'VIDEO');
//   const reelBatch = batch.filter(item => item.mediaType.toUpperCase() === 'REELS');
  
//   return Promise.all([
//     ...imageBatch.map(item => retryOperation(() => postImageToFacebook(item))),
//     ...videoBatch.map(item => retryOperation(() => postVideoToFacebook(item))),
//     ...reelBatch.map(item => retryOperation(() => postReelToFacebook(item)))
//   ]);
// }

// async function postImageToFacebook(item) {
//   logStep('postImageToFacebook', `Posting image to Facebook: pageId=${item.pageId}`);
//   const url = `https://graph.facebook.com/v20.0/${item.pageId}/photos`;
//   const payload = {
//     'access_token': item.accessToken,
//     'caption': item.caption,
//     'url': item.mediaUrl
//   };
  
//   const response = await UrlFetchApp.fetch(url, {
//     'method': 'post',
//     'payload': payload,
//     'muteHttpExceptions': true
//   });
  
//   const responseData = JSON.parse(response.getContentText());
//   logStep('postImageToFacebook', `Response: ${JSON.stringify(responseData)}`);
  
//   if (responseData && responseData.id) {
//     await updateSheetStatus('facebook', item.row, `Posted successfully: https://www.facebook.com/${responseData.id}`);
//   } else {
//     throw new Error("Failed to post image to Facebook");
//   }
  
//   return responseData;
// }

// async function postVideoToFacebook(item) {
//   logStep('postVideoToFacebook', `Posting video to Facebook: pageId=${item.pageId}`);
//   const url = `https://graph.facebook.com/v20.0/${item.pageId}/videos`;
//   const payload = {
//     'access_token': item.accessToken,
//     'description': item.caption,
//     'file_url': item.mediaUrl
//   };
  
//   const response = await UrlFetchApp.fetch(url, {
//     'method': 'post',
//     'payload': payload,
//     'muteHttpExceptions': true
//   });
  
//   const responseData = JSON.parse(response.getContentText());
//   logStep('postVideoToFacebook', `Response: ${JSON.stringify(responseData)}`);
  
//   if (responseData && responseData.id) {
//     await updateSheetStatus('facebook', item.row, `Video posted successfully: https://www.facebook.com/${responseData.id}`);
//   } else {
//     throw new Error("Failed to post video to Facebook");
//   }
  
//   return responseData;
// }

// async function postReelToFacebook(item) {
//   logStep('postReelToFacebook', `Posting reel to Facebook: pageId=${item.pageId}`);
  
//   // Step 1: Create a Reel container
//   const containerUrl = `https://graph.facebook.com/v21.0/${item.pageId}/video_reels`;
//   const containerPayload = {
//     access_token: item.accessToken,
//     upload_phase: 'start'
//   };
  
//   const containerResponse = await UrlFetchApp.fetch(containerUrl, {
//     method: 'post',
//     payload: containerPayload,
//     muteHttpExceptions: true
//   });
  
//   const containerJson = JSON.parse(containerResponse.getContentText());
//   if (containerJson.error) throw new Error(`Error creating Reel container: ${containerJson.error.message}`);
  
//   const { video_id } = containerJson;
  
//   // Step 2: Upload the video
//   const uploadUrl = `https://rupload.facebook.com/video-upload/v21.0/${video_id}`;
//   const uploadHeaders = {
//     'Authorization': `OAuth ${item.accessToken}`,
//     'file_url': item.mediaUrl
//   };
  
//   const uploadResponse = await UrlFetchApp.fetch(uploadUrl, {
//     method: 'post',
//     headers: uploadHeaders,
//     muteHttpExceptions: true
//   });
  
//   const uploadResult = JSON.parse(uploadResponse.getContentText());
//   if (!uploadResult.success) throw new Error(`Video upload failed: ${JSON.stringify(uploadResult)}`);
  
//   // Step 3: Finish and publish the Reel
//   const finishUrl = `https://graph.facebook.com/v21.0/${item.pageId}/video_reels`;
//   const finishPayload = {
//     access_token: item.accessToken,
//     video_id: video_id,
//     upload_phase: 'finish',
//     video_state: 'PUBLISHED',
//     description: item.caption
//   };
  
//   const finishResponse = await UrlFetchApp.fetch(finishUrl, {
//     method: 'post',
//     payload: finishPayload,
//     muteHttpExceptions: true
//   });
  
//   const publishResult = JSON.parse(finishResponse.getContentText());
//   if (!publishResult.success) throw new Error(`Reel publish failed: ${JSON.stringify(publishResult)}`);
  
//   await updateSheetStatus('facebook', item.row, `Reel posted successfully: video_id=${video_id}`);
//   return publishResult;
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

// // Helper function

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