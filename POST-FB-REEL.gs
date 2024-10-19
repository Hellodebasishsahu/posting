// async function processFacebookVideoBatch(batch) {
//     logStep('processFacebookVideoBatch', `Processing ${batch.length} Facebook videos/reels`);
//     for (const item of batch) {
//         try {
//             logStep('processFacebookVideoBatch', `Processing item for row ${item.row}`);
//             let result;
//             if (item.mediaType.toLowerCase() === 'reel') {
//                 result = await postReelToFacebook(item.pageId, item.accessToken, item.mediaUrl, item.caption);
//             } else {
//                 result = await postVideoToFacebook(item.pageId, item.accessToken, item.mediaUrl, item.caption);
//             }
//             logStep('processFacebookVideoBatch', `Row ${item.row}: ${item.mediaType} posted successfully`);
//             await updateSheetStatus('facebook', item.row, `${item.mediaType} posted successfully: ${JSON.stringify(result)}`);
//         } catch (error) {
//             logStep('processFacebookVideoBatch', `Error processing ${item.mediaType} for row ${item.row}: ${error.message}`);
//             await updateSheetStatus('facebook', item.row, `Error: ${error.message}`);
//         }
//     }
// }

// async function postVideoToFacebook(pageId, accessToken, videoUrl, caption) {
//     const url = `https://graph.facebook.com/v20.0/${pageId}/videos`;
//     const payload = {
//         access_token: accessToken,
//         description: caption,
//         file_url: videoUrl
//     };

//     logStep('postVideoToFacebook', `Posting video with payload: ${JSON.stringify(payload)}`);
//     const response = UrlFetchApp.fetch(url, {
//         method: 'post',
//         payload: payload,
//         muteHttpExceptions: true
//     });

//     const responseText = response.getContentText();
//     logStep('postVideoToFacebook', `Response: ${responseText}`);
//     return JSON.parse(responseText);
// }

// async function postReelToFacebook(pageId, accessToken, videoUrl, caption) {
//     try {
//         // Step 1: Create a Reel container
//         const containerUrl = `https://graph.facebook.com/v21.0/${pageId}/video_reels`;
//         const containerPayload = {
//             access_token: accessToken,
//             upload_phase: 'start'
//         };

//         logStep('postReelToFacebook', `Creating Reel container: ${JSON.stringify(containerPayload)}`);
//         const containerResponse = UrlFetchApp.fetch(containerUrl, {
//             method: 'post',
//             payload: containerPayload,
//             muteHttpExceptions: true
//         });

//         const containerJson = JSON.parse(containerResponse.getContentText());
//         logStep('postReelToFacebook', `Container response: ${JSON.stringify(containerJson)}`);

//         if (containerJson.error) {
//             throw new Error(`Error creating Reel container: ${containerJson.error.message}`);
//         }

//         const { upload_url, video_id } = containerJson;

//         // Step 2: Upload the video directly using the rupload endpoint
//         const ruploadUrl = `https://rupload.facebook.com/video-upload/v21.0/${video_id}`;
//         const ruploadHeaders = {
//             'Authorization': `OAuth ${accessToken}`,
//             'file_url': videoUrl
//         };

//         logStep('postReelToFacebook', `Uploading video to: ${ruploadUrl}`);
//         const ruploadResponse = UrlFetchApp.fetch(ruploadUrl, {
//             method: 'post',
//             headers: ruploadHeaders,
//             muteHttpExceptions: true
//         });

//         const uploadResult = JSON.parse(ruploadResponse.getContentText());
//         logStep('postReelToFacebook', `Upload response: ${JSON.stringify(uploadResult)}`);

//         if (!uploadResult.success) {
//             throw new Error(`Video upload failed: ${JSON.stringify(uploadResult)}`);
//         }

//         // Step 3: Finish and publish the Reel
//         const finishUrl = `https://graph.facebook.com/v21.0/${pageId}/video_reels`;
//         const finishPayload = {
//             access_token: accessToken,
//             video_id: video_id,
//             upload_phase: 'finish',
//             video_state: 'PUBLISHED',
//             description: caption
//         };

//         logStep('postReelToFacebook', `Publishing Reel: ${JSON.stringify(finishPayload)}`);
//         const finishResponse = UrlFetchApp.fetch(finishUrl, {
//             method: 'post',
//             payload: finishPayload,
//             muteHttpExceptions: true
//         });

//         const publishResult = JSON.parse(finishResponse.getContentText());
//         logStep('postReelToFacebook', `Publish response: ${JSON.stringify(publishResult)}`);

//         if (!publishResult.success) {
//             throw new Error(`Reel publish failed: ${JSON.stringify(publishResult)}`);
//         }

//         logStep('postReelToFacebook', `Reel published successfully: video_id=${video_id}`);
//         return publishResult;

//     } catch (error) {
//         logStep('postReelToFacebook', `Error: ${error.message}`);
//         throw error;
//     }
// }


