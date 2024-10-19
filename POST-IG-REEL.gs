// async function processInstagramReelBatch(batch) {
//     logStep('processInstagramReelBatch', "Processing Instagram reel batch");
//     logStep('processInstagramReelBatch', `Received batch: ${JSON.stringify(batch)}`);
//     const results = [];

//     for (const item of batch) {
//         try {
//             logStep('processInstagramReelBatch', `Processing item for row ${item.row}`);
//             logStep('processInstagramReelBatch', `Item details: ${JSON.stringify(item)}`);

//             // Step 1: Create Reel Container
//             const containerResponse = await createReelContainer(item.accountId, item.caption, item.mediaUrl);
//             logStep('processInstagramReelBatch', `Received container response: ${JSON.stringify(containerResponse)}`);

//             if (containerResponse && containerResponse.id) {
//                 // Step 2: Sleep before publishing
//                 logStep('processInstagramReelBatch', `Waiting for 5 seconds before publishing reel for row ${item.row}`);
//                 Utilities.sleep(5000); // Sleep for 5 seconds

//                 // Step 3: Publish Reel
//                 logStep('processInstagramReelBatch', `Publishing Instagram reel for row ${item.row}`);
//                 const publishResponse = await publishInstagramReel(item.accountId, containerResponse.id);
//                 logStep('processInstagramReelBatch', `Publish response: ${JSON.stringify(publishResponse)}`);

//                 if (publishResponse && publishResponse.id) {
//                     logStep('processInstagramReelBatch', `Row ${item.row}: Instagram reel posted successfully`);
//                     await updateSheetStatus('instagram', item.row, `Reel posted successfully: https://www.instagram.com/reel/${publishResponse.id}`);
//                     results.push({ platform: 'instagram', row: item.row, status: 'success', id: publishResponse.id });
//                 } else {
//                     throw new Error("Failed to publish Instagram reel");
//                 }
//             } else {
//                 throw new Error("Failed to create reel container");
//             }
//         } catch (error) {
//             logStep('processInstagramReelBatch', `Error processing Instagram reel for row ${item.row}: ${error.message}`);
//             await updateSheetStatus('instagram', item.row, `Error: ${error.message}`);
//             results.push({ platform: 'instagram', row: item.row, status: 'error', error: error.message });
//         }
//     }
//     logStep('processInstagramReelBatch', `Finished processing batch. Results: ${JSON.stringify(results)}`);
//     return results;
// }

// async function createReelContainer(accountId, caption, videoUrl) {
//     try {
//         logStep('createReelContainer', `Creating reel container: accountId=${accountId}, caption=${caption}`);
//         const url = `https://graph.facebook.com/v21.0/${accountId}/media`;

//         const payload = {
//             'media_type': 'REELS',  // Specify reel type
//             'video_url': videoUrl,  // Pass video URL directly
//             'caption': caption,
//             'access_token': accessToken
//         };

//         logStep('createReelContainer', `Outgoing payload: ${JSON.stringify(payload)}`);
//         const options = {
//             method: 'post',
//             payload: payload,
//             muteHttpExceptions: true
//         };

//         const response = await UrlFetchApp.fetch(url, options);
//         const responseText = response.getContentText();
//         logStep('createReelContainer', `Response: ${responseText}`);

//         const parsedResponse = JSON.parse(responseText);
//         if (!parsedResponse.id) {
//             throw new Error(`Failed to create reel container. Response: ${responseText}`);
//         }
//         return parsedResponse;
//     } catch (error) {
//         logStep('createReelContainer', `Error: ${error.message}`);
//         throw error;
//     }
// }

// async function publishInstagramReel(accountId, mediaId, maxRetries = 5, retryInterval = 5000) {
//     logStep('publishInstagramReel', `Publishing Instagram reel: accountId=${accountId}, mediaId=${mediaId}`);
//     const url = `https://graph.facebook.com/v21.0/${accountId}/media_publish`;

//     const payload = {
//         'creation_id': mediaId,
//         'access_token': accessToken
//     };

//     logStep('publishInstagramReel', `Request payload: ${JSON.stringify(payload)}`);

//     const options = {
//         method: 'post',
//         payload: payload,
//         muteHttpExceptions: true
//     };

//     for (let attempt = 1; attempt <= maxRetries; attempt++) {
//         try {
//             const response = UrlFetchApp.fetch(url, options);
//             const responseText = response.getContentText();
//             logStep('publishInstagramReel', `Response (Attempt ${attempt}): ${responseText}`);

//             const parsedResponse = JSON.parse(responseText);

//             if (parsedResponse.id) {
//                 return parsedResponse;  // Success: return the media ID
//             } else if (parsedResponse.error) {
//                 const error = parsedResponse.error;
//                 if (error.code === 9007 && error.error_subcode === 2207027) {
//                     // Media not ready, wait and retry
//                     logStep('publishInstagramReel', `Media not ready. Retrying in ${retryInterval / 1000} seconds...`);
//                     Utilities.sleep(retryInterval);  // Wait before next attempt
//                 } else {
//                     throw new Error(`Failed to publish reel: ${error.message}`);
//                 }
//             }
//         } catch (error) {
//             logStep('publishInstagramReel', `Error on attempt ${attempt}: ${error.message}`);
//             if (attempt === maxRetries) {
//                 throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
//             }
//         }
//     }

//     throw new Error('Exceeded maximum retries. Media not ready for publishing.');
// }