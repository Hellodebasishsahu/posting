// async function processFacebookImageBatch(batch) {
//     logAdvanced("Processing Facebook image batch");
//     return Promise.all(batch.map(async item => {
//         return new Promise(async (resolve, reject) => {
//             const startTime = new Date();
//             logAdvanced(`Start processing row ${item.row}`, { startTime: startTime.toISOString() });

//             const payload = {
//                 access_token: item.accessToken,
//                 caption: item.caption,
//                 url: item.mediaUrl
//             };
//             logAdvanced(`Outgoing payload for postImageToFacebook`, payload);

//             try {
//                 const response = await postImageToFacebook(item.pageId, item.accessToken, item.mediaUrl, item.caption);
//                 const endTime = new Date();
//                 logAdvanced(`postImageToFacebook response for row ${item.row}`, { response, endTime: endTime.toISOString() });
//                 logAdvanced(`Total processing time for row ${item.row}`, { duration: (endTime - startTime) / 1000 });

//                 if (response && response.id) {
//                     logAdvanced(`Row ${item.row}: Facebook image posted successfully`);
//                     await updateSheetStatus('facebook', item.row, `Posted successfully: https://www.facebook.com/${response.id}`);
//                     resolve();
//                 } else {
//                     reject(new Error("Failed to post image to Facebook"));
//                 }
//             } catch (error) {
//                 logAdvanced(`Error posting image to Facebook for row ${item.row}`, { error: error.message });
//                 await updateSheetStatus('facebook', item.row, `Error: ${error.message}`);
//                 reject(error);
//             }
//         });
//     }));
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