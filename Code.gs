const businessId = '1373131700291227';

const accessToken = 'EAAGqJkJgmwgBO4o05kEvsYFvwCVcEF17TMwv8t3QXYr22KaLVHsWxN177gzZAGrysPQ6Laf9z9Xdyz3fZCjKH6e6APZCmEkdy2oeuk7o7IxkUnHKHQCR20tgwYbQkZCIZBVgzEIg48HA9AGFTF4AXVd8rGndZA0krnKrYUY4xaB5iAX6ZCdgFBeZCzkJ';

function logStep(step, details) {
    console.log(`[${new Date().toISOString()}] [${step}] ${details}`);
}
// function createInstagramMedia(accountId, mediaUrl, caption, mediaType) {
//     logStep('createInstagramMedia', `Creating Instagram media: accountId=${accountId}, mediaType=${mediaType}`);
//     const url = `https://graph.facebook.com/v20.0/${accountId}/media`;
//     const formData = {
//         'access_token': accessToken,
//         'caption': caption,
//         'media_type': mediaType,
//         'image_url': mediaUrl
//     };

//     logStep('createInstagramMedia', `Request payload: ${JSON.stringify(formData)}`);

//     const options = {
//         'method': 'post',
//         'payload': formData,
//         'muteHttpExceptions': true
//     };

//     const response = UrlFetchApp.fetch(url, options);
//     const responseText = response.getContentText();
//     logStep('createInstagramMedia', `Response: ${responseText}`);

//     return JSON.parse(responseText);
// }

// function publishInstagramMedia(accountId, mediaId) {
//     logStep('publishInstagramMedia', `Publishing Instagram media: accountId=${accountId}, mediaId=${mediaId}`);
//     const url = `https://graph.facebook.com/v20.0/${accountId}/media_publish`;
//     const payload = {
//         'access_token': accessToken,
//         'creation_id': mediaId
//     };

//     logStep('publishInstagramMedia', `Request payload: ${JSON.stringify(payload)}`);

//     const options = {
//         'method': 'post',
//         'payload': payload,
//         'muteHttpExceptions': true
//     };

//     const response = UrlFetchApp.fetch(url, options);
//     const responseText = response.getContentText();
//     logStep('publishInstagramMedia', `Response: ${responseText}`);

//     return JSON.parse(responseText);
// }

// function uploadVideoContent(containerId, videoUrl) {
//     logStep('uploadVideoContent', `Uploading video content: containerId=${containerId}, videoUrl=${videoUrl}`);

//     const startPayload = {
//         'access_token': accessToken,
//         'upload_phase': 'start',
//         'file_size': videoUrl.length // Optional: Include file size if known
//     };

//     const startOptions = {
//         'method': 'post',
//         'payload': startPayload,
//         'muteHttpExceptions': true
//     };

//     logStep('uploadVideoContent', `Sending start upload request with payload: ${JSON.stringify(startPayload)}`);
//     const startResponse = UrlFetchApp.fetch(`https://graph.facebook.com/v20.0/${containerId}`, startOptions);
//     const startJson = JSON.parse(startResponse.getContentText());
//     logStep('uploadVideoContent', `Start upload response: ${startResponse.getContentText()}`);

//     if (!startJson.upload_url || !startJson.video_id) {
//         throw new Error("Failed to initiate video upload: Missing upload URL or video ID.");
//     }

//     const uploadUrl = startJson.upload_url;
//     const videoId = startJson.video_id;

//     // Splitting the video into chunks (if needed)
//     logStep('uploadVideoContent', `Uploading video in chunks to: ${uploadUrl}`);
//     const chunkPayload = {
//         'upload_phase': 'transfer',
//         'start_offset': '0',
//         'video_file_chunk': videoUrl,
//         'access_token': accessToken
//     };

//     const chunkOptions = {
//         'method': 'post',
//         'payload': chunkPayload,
//         'muteHttpExceptions': true
//     };

//     logStep('uploadVideoContent', `Sending chunk upload request with payload: ${JSON.stringify(chunkPayload)}`);
//     const chunkResponse = UrlFetchApp.fetch(uploadUrl, chunkOptions);
//     const chunkJson = JSON.parse(chunkResponse.getContentText());
//     logStep('uploadVideoContent', `Chunk upload response: ${chunkResponse.getContentText()}`);

//     if (!chunkJson.success) {
//         throw new Error("Video chunk upload failed.");
//     }

//     // Completing the upload process
//     const finishPayload = {
//         'access_token': accessToken,
//         'upload_phase': 'finish',
//         'video_id': videoId
//     };

//     const finishOptions = {
//         'method': 'post',
//         'payload': finishPayload,
//         'muteHttpExceptions': true
//     };

//     logStep('uploadVideoContent', `Sending finish upload request with payload: ${JSON.stringify(finishPayload)}`);
//     const finishResponse = UrlFetchApp.fetch(`https://graph.facebook.com/v20.0/${containerId}`, finishOptions);
//     const finishJson = JSON.parse(finishResponse.getContentText());
//     logStep('uploadVideoContent', `Finish upload response: ${finishResponse.getContentText()}`);

//     if (!finishJson.success) {
//         throw new Error("Failed to complete video upload.");
//     }

//     logStep('uploadVideoContent', `Video uploaded successfully. Video ID: ${videoId}`);
//     return finishJson;
// }

// function createReelContainer(accountId, caption, videoUrl) {
//     logStep('createReelContainer', `Creating reel container: accountId=${accountId}, caption=${caption}`);
//     const url = `https://graph.facebook.com/v20.0/${accountId}/media`;
//     const payload = {
//         'access_token': accessToken,
//         'media_type': 'REELS',
//         'video_url': videoUrl,
//         'caption': caption
//     };

//     logStep('createReelContainer', `Outgoing payload: ${JSON.stringify(payload)}`);
//     const options = {
//         'method': 'post',
//         'payload': payload,
//         'muteHttpExceptions': true
//     };

//     const response = UrlFetchApp.fetch(url, options);
//     const responseText = response.getContentText();
//     logStep('createReelContainer', `Response: ${responseText}`);

//     return JSON.parse(responseText);
// }

// function publishInstagramReel(accountId, mediaId) {
//     logStep('publishInstagramReel', `Publishing Instagram reel: accountId=${accountId}, mediaId=${mediaId}`);
//     const url = `https://graph.facebook.com/v20.0/${accountId}/media_publish`;
//     const payload = {
//         'access_token': accessToken,
//         'creation_id': mediaId
//     };

//     logStep('publishInstagramReel', `Request payload: ${JSON.stringify(payload)}`);
//     const options = {
//         'method': 'post',
//         'payload': payload,
//         'muteHttpExceptions': true
//     };

//     const response = UrlFetchApp.fetch(url, options);
//     const responseText = response.getContentText();
//     logStep('publishInstagramReel', `Response: ${responseText}`);
//     return JSON.parse(responseText);
// }

// function postImageToFacebook(pageId, pageAccessToken, mediaUrl, caption) {
//     logStep('postImageToFacebook', `Posting image to Facebook: pageId=${pageId}`);
//     const url = `https://graph.facebook.com/v20.0/${pageId}/photos`;
//     const formData = {
//         'access_token': pageAccessToken,
//         'caption': caption,
//         'url': mediaUrl
//     };

//     logStep('postImageToFacebook', `Request payload: ${JSON.stringify(formData)}`);

//     const options = {
//         'method': 'post',
//         'payload': formData,
//         'muteHttpExceptions': true
//     };

//     const response = UrlFetchApp.fetch(url, options);
//     const responseText = response.getContentText();
//     logStep('postImageToFacebook', `Response: ${responseText}`);

//     return JSON.parse(responseText);
// }

// function postReelToFacebook(pageId, accessToken, videoUrl, caption) {
//     logStep('postReelToFacebook', `Posting video to Facebook: pageId=${pageId}`);
//     const url = `https://graph.facebook.com/v20.0/${pageId}/videos`;
//     const payload = {
//         'access_token': accessToken,
//         'description': caption,
//         'file_url': videoUrl
//     };

//     logStep('postReelToFacebook', `Outgoing payload: ${JSON.stringify(payload)}`);
//     const options = {
//         'method': 'post',
//         'payload': payload,
//         'muteHttpExceptions': true
//     };

//     const response = UrlFetchApp.fetch(url, options);
//     const responseText = response.getContentText();
//     logStep('postReelToFacebook', `Response: ${responseText}`);

//     return JSON.parse(responseText);
// }

// const FacebookAPI = {
//     getPages: function(businessId, accessToken) {
//         logStep('getPages', `Fetching pages for business: businessId=${businessId}`);
//         let pages = [];
//         let url = `https://graph.facebook.com/v20.0/${businessId}/owned_pages?access_token=${encodeURIComponent(accessToken)}&fields=id,access_token,name&limit=100`;

//         while (url) {
//             const response = UrlFetchApp.fetch(url, { 'muteHttpExceptions': true });
//             const jsonResponse = JSON.parse(response.getContentText());
//             logStep('getPages', `Response: ${response.getContentText()}`);

//             if (jsonResponse.data) {
//                 pages = pages.concat(jsonResponse.data.map(page => ({
//                     id: page.id,
//                     name: page.name,
//                     access_token: page.access_token
//                 })));
//             } else {
//                 throw new Error("Failed to fetch pages: " + response.getContentText());
//             }

//             url = jsonResponse.paging && jsonResponse.paging.next ? jsonResponse.paging.next : null;
//         }

//         return pages;
//     }
// };

// function postToSocialMedia() {
//     console.time("postToSocialMedia");
//     logStep('postToSocialMedia', "Starting postToSocialMedia function");

//     if (!businessId || !accessToken) {
//         logStep('postToSocialMedia', "Business ID or Access Token is missing.");
//         console.timeEnd("postToSocialMedia");
//         return;
//     }

//     logStep('postToSocialMedia', "Fetching pages for business ID: " + businessId);
//     const pages = FacebookAPI.getPages(businessId, accessToken);
//     if (!pages || pages.length === 0) {
//         logStep('postToSocialMedia', "No pages found or an error occurred.");
//         console.timeEnd("postToSocialMedia");
//         return;
//     }
//     logStep('postToSocialMedia', "Fetched pages: " + JSON.stringify(pages));

//     const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//     const data = sheet.getDataRange().getValues();
//     logStep('postToSocialMedia', "Fetched data from sheet: " + JSON.stringify(data));

//     // Prepare batches
//     const igImageCreationBatch = [];
//     const igReelCreationBatch = [];
//     const fbImageBatch = [];
//     const fbReelBatch = [];

//     // Clear status columns
//     logStep('postToSocialMedia', "Clearing status columns");
//     sheet.getRange(2, 12, sheet.getLastRow() - 1, 2).clearContent();

//     for (let i = 1; i < data.length; i++) {
//         const [, , caption, mediaUrl, mediaType, , facebookPageId, instagramAccountId, , facebookTickbox, instagramTickbox] = data[i];
//         logStep('postToSocialMedia', `Processing row ${i + 1}: mediaUrl=${mediaUrl}, mediaType=${mediaType}, facebookPageId=${facebookPageId}, instagramAccountId=${instagramAccountId}`);

//         if (!mediaUrl) {
//             logStep('postToSocialMedia', `Row ${i + 1}: Media URL is missing`);
//             sheet.getRange(i + 1, 12, 1, 2).setValue("Media URL is missing");
//             continue;
//         }

//         if (instagramTickbox && instagramAccountId) {
//             if (mediaType.toLowerCase() === 'image') {
//                 igImageCreationBatch.push({ accountId: instagramAccountId, mediaUrl, caption, row: i + 1 });
//                 logStep('postToSocialMedia', `Row ${i + 1}: Added to Instagram image batch`);
//             } else if (mediaType.toLowerCase() === 'reel') {
//                 igReelCreationBatch.push({ accountId: instagramAccountId, mediaUrl, caption, row: i + 1 });
//                 logStep('postToSocialMedia', `Row ${i + 1}: Added to Instagram reel batch`);
//             }
//         }

//         if (facebookTickbox && facebookPageId) {
//             const page = pages.find(p => p.id === facebookPageId.toString());
//             if (page) {
//                 if (mediaType.toLowerCase() === 'image') {
//                     fbImageBatch.push({ pageId: page.id, accessToken: page.access_token, mediaUrl, caption, row: i + 1 });
//                     logStep('postToSocialMedia', `Row ${i + 1}: Added to Facebook image batch`);
//                 } else if (mediaType.toLowerCase() === 'reel') {
//                     fbReelBatch.push({ pageId: page.id, accessToken: page.access_token, mediaUrl, caption, row: i + 1 });
//                     logStep('postToSocialMedia', `Row ${i + 1}: Added to Facebook reel batch`);
//                 }
//             } else {
//                 logStep('postToSocialMedia', `Row ${i + 1}: Facebook page not found (Page ID: ${facebookPageId})`);
//                 sheet.getRange(i + 1, 12).setValue("Facebook page not found");
//             }
//         }
//     }

//     logStep('postToSocialMedia', "Processing batches in parallel");
//     Promise.all([
//         processInstagramImageBatch(igImageCreationBatch),
//         processInstagramReelBatch(igReelCreationBatch),
//         processFacebookImageBatch(fbImageBatch),
//         processFacebookReelBatch(fbReelBatch)
//     ])
//     .then(() => {
//         logStep('postToSocialMedia', "All batches processed");
//         console.timeEnd("postToSocialMedia");
//     })
//     .catch(error => {
//         logStep('postToSocialMedia', "Error processing batches: " + error.message);
//         console.timeEnd("postToSocialMedia");
//     });
// }

// function logAdvanced(message, data = null) {
//     const timestamp = new Date().toISOString();
//     if (data) {
//         console.log(`[${timestamp}] ${message}: ${JSON.stringify(data)}`);
//     } else {
//         console.log(`[${timestamp}] ${message}`);
//     }
// }

// function processFacebookReelBatch(batch) {
//     logAdvanced("Processing Facebook video batch");
//     return Promise.all(batch.map(item => {
//         return new Promise((resolve) => {
//             try {
//                 const startTime = new Date();
//                 logAdvanced(`Start processing row ${item.row}`, { startTime: startTime.toISOString() });

//                 const payload = {
//                     access_token: item.accessToken,
//                     description: item.caption,
//                     file_url: item.mediaUrl
//                 };
//                 logAdvanced(`Outgoing payload for postReelToFacebook`, payload);

//                 const response = postReelToFacebook(item.pageId, item.accessToken, item.mediaUrl, item.caption);
//                 const endTime = new Date();
//                 logAdvanced(`postReelToFacebook response for row ${item.row}`, { response, endTime: endTime.toISOString() });
//                 logAdvanced(`Total processing time for row ${item.row}`, { duration: (endTime - startTime) / 1000 });

//                 if (response && response.id) {
//                     logAdvanced(`Row ${item.row}: Facebook video posted successfully`);
//                     updateSheetStatus('facebook', item.row, `Video posted successfully: https://www.facebook.com/${response.id}`);
//                 } else {
//                     throw new Error("Failed to post video to Facebook");
//                 }
//             } catch (error) {
//                 logAdvanced(`Error posting video to Facebook for row ${item.row}`, { error: error.message });
//                 updateSheetStatus('facebook', item.row, `Error: ${error.message}`);
//             }
//             resolve();
//         });
//     }));
// }

// function processInstagramImageBatch(batch) {
//     logStep('processInstagramImageBatch', "Processing Instagram image batch");
//     return Promise.all(batch.map(item => {
//         return new Promise((resolve) => {
//             try {
//                 logStep('processInstagramImageBatch', `Creating Instagram media for row ${item.row}`);
//                 const payload = {
//                     access_token: accessToken,
//                     caption: item.caption,
//                     media_type: 'IMAGE',
//                     image_url: item.mediaUrl
//                 };
//                 logStep('processInstagramImageBatch', `Outgoing payload: ${JSON.stringify(payload)}`);
//                 const mediaResponse = createInstagramMedia(item.accountId, item.mediaUrl, item.caption, 'IMAGE');
//                 logStep('processInstagramImageBatch', `Response: ${JSON.stringify(mediaResponse)}`);
                
//                 if (mediaResponse && mediaResponse.id) {
//                     logStep('processInstagramImageBatch', `Publishing Instagram media for row ${item.row}`);
//                     const publishPayload = {
//                         access_token: accessToken,
//                         creation_id: mediaResponse.id
//                     };
//                     logStep('processInstagramImageBatch', `Outgoing payload: ${JSON.stringify(publishPayload)}`);
//                     const publishResponse = publishInstagramMedia(item.accountId, mediaResponse.id);
//                     logStep('processInstagramImageBatch', `Response: ${JSON.stringify(publishResponse)}`);
                    
//                     if (publishResponse && publishResponse.id) {
//                         logStep('processInstagramImageBatch', `Row ${item.row}: Instagram image posted successfully`);
//                         updateSheetStatus('instagram', item.row, `Posted successfully: https://www.instagram.com/p/${publishResponse.id}`);
//                     } else {
//                         throw new Error("Failed to publish Instagram media");
//                     }
//                 } else {
//                     throw new Error("Failed to create Instagram media");
//                 }
//             } catch (error) {
//                 logStep('processInstagramImageBatch', `Error processing Instagram image for row ${item.row}: ${error.message}`);
//                 updateSheetStatus('instagram', item.row, `Error: ${error.message}`);
//             }
//             resolve();
//         });
//     }));
// }

// function processInstagramReelBatch(batch) {
//     logStep('processInstagramReelBatch', "Processing Instagram reel batch");
//     return Promise.all(batch.map(item => {
//         return new Promise((resolve) => {
//             try {
//                 logStep('processInstagramReelBatch', `Creating reel container for row ${item.row}`);
//                 const containerResponse = createReelContainer(item.accountId, item.caption, item.mediaUrl);
//                 logStep('processInstagramReelBatch', `Response: ${JSON.stringify(containerResponse)}`);
                
//                 if (containerResponse && containerResponse.id) {
//                     logStep('processInstagramReelBatch', `Publishing Instagram reel for row ${item.row}`);
//                     const publishPayload = {
//                         access_token: accessToken,
//                         creation_id: containerResponse.id
//                     };
//                     logStep('processInstagramReelBatch', `Outgoing payload: ${JSON.stringify(publishPayload)}`);
//                     const publishResponse = publishInstagramReel(item.accountId, containerResponse.id);
//                     logStep('processInstagramReelBatch', `Response: ${JSON.stringify(publishResponse)}`);
                    
//                     if (publishResponse && publishResponse.id) {
//                         logStep('processInstagramReelBatch', `Row ${item.row}: Instagram reel posted successfully`);
//                         updateSheetStatus('instagram', item.row, `Reel posted successfully: https://www.instagram.com/reel/${publishResponse.id}`);
//                     } else {
//                         throw new Error("Failed to publish Instagram reel");
//                     }
//                 } else {
//                     throw new Error("Failed to create reel container");
//                 }
//             } catch (error) {
//                 logStep('processInstagramReelBatch', `Error processing Instagram reel for row ${item.row}: ${error.message}`);
//                 updateSheetStatus('instagram', item.row, `Error: ${error.message}`);
//             }
//             resolve();
//         });
//     }));
// }
// function processFacebookImageBatch(batch) {
//     logAdvanced("Processing Facebook image batch");
//     return Promise.all(batch.map(item => {
//         return new Promise((resolve) => {
//             try {
//                 const startTime = new Date();
//                 logAdvanced(`Start processing row ${item.row}`, { startTime: startTime.toISOString() });

//                 const payload = {
//                     access_token: item.accessToken,
//                     caption: item.caption,
//                     url: item.mediaUrl
//                 };
//                 logAdvanced(`Outgoing payload for postImageToFacebook`, payload);

//                 const response = postImageToFacebook(item.pageId, item.accessToken, item.mediaUrl, item.caption);
//                 const endTime = new Date();
//                 logAdvanced(`postImageToFacebook response for row ${item.row}`, { response, endTime: endTime.toISOString() });
//                 logAdvanced(`Total processing time for row ${item.row}`, { duration: (endTime - startTime) / 1000 });

//                 if (response && response.id) {
//                     logAdvanced(`Row ${item.row}: Facebook image posted successfully`);
//                     updateSheetStatus('facebook', item.row, `Posted successfully: https://www.facebook.com/${response.id}`);
//                 } else {
//                     throw new Error("Failed to post image to Facebook");
//                 }
//             } catch (error) {
//                 logAdvanced(`Error posting image to Facebook for row ${item.row}`, { error: error.message });
//                 updateSheetStatus('facebook', item.row, `Error: ${error.message}`);
//             }
//             resolve();
//         });
//     }));
// }