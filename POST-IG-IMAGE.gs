// async function processInstagramImageBatch(batch) {
//     if (batch.length === 0) {
//         logStep('processInstagramImageBatch', "Batch is empty, nothing to process");
//         return [];
//     }

//     logStep('processInstagramImageBatch', `Processing ${batch.length} Instagram images`);

//     return Promise.all(batch.map(async item => {
//         return new Promise(async (resolve, reject) => {
//             logStep('processInstagramImageBatch', `Creating Instagram media for row ${item.row}`);

//             try {
//                 const payload = {
//                     access_token: accessToken,
//                     caption: item.caption,
//                     media_type: 'IMAGE',
//                     image_url: item.mediaUrl
//                 };
//                 logStep('processInstagramImageBatch', `Outgoing payload: ${JSON.stringify(payload)}`);

//                 const mediaResponse = await createInstagramMedia(item.accountId, item.mediaUrl, item.caption, 'IMAGE');
//                 logStep('processInstagramImageBatch', `Response: ${JSON.stringify(mediaResponse)}`);

//                 if (mediaResponse && mediaResponse.id) {
//                     logStep('processInstagramImageBatch', `Publishing Instagram media for row ${item.row}`);
//                     const publishPayload = {
//                         access_token: accessToken,
//                         creation_id: mediaResponse.id
//                     };
//                     logStep('processInstagramImageBatch', `Outgoing payload: ${JSON.stringify(publishPayload)}`);

//                     const publishResponse = await publishInstagramMedia(item.accountId, mediaResponse.id);
//                     logStep('processInstagramImageBatch', `Response: ${JSON.stringify(publishResponse)}`);

//                     if (publishResponse && publishResponse.id) {
//                         logStep('processInstagramImageBatch', `Row ${item.row}: Instagram image posted successfully`);
//                         await updateSheetStatus('instagram', item.row, `Posted successfully: https://www.instagram.com/p/${publishResponse.id}`);
//                         resolve();  // Resolve the promise here
//                     } else {
//                         reject(new Error("Failed to publish Instagram media"));
//                     }
//                 } else {
//                     reject(new Error("Failed to create Instagram media"));
//                 }
//             } catch (error) {
//                 logStep('processInstagramImageBatch', `Error processing Instagram image for row ${item.row}: ${error.message}`);
//                 await updateSheetStatus('instagram', item.row, `Error: ${error.message}`);
//                 reject(error);  // Reject the promise on error
//             }
//         });
//     }));
// }
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