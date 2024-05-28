import { configDotenv } from "dotenv";
import XLSX from 'xlsx';
configDotenv()

////////////////////////////////////////////////////////////////////////////////
// Util functions
function renameKey(arrayOfObjects, oldKey, newKey) {
    return arrayOfObjects.map(obj => {
        if (obj.hasOwnProperty(oldKey)) {
            obj[newKey] = obj[oldKey];
            delete obj[oldKey];
        }
        return obj;
    });
}

function arrayToExcel(data, filename = 'output.xlsx', sheetName = 'Sheet1') {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    // Convert the array of objects into a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    // Write the workbook to a file
    XLSX.writeFile(workbook, filename);
}

function mergeArrays(...arrays) {
    let mergedArray = [];

    arrays.forEach(array => {
        array.forEach(item => {
            const existingItemIndex = mergedArray.findIndex(
                mergedItem => mergedItem.fid === item.fid
            );

            if (existingItemIndex === -1) {
                mergedArray.push(item);
            } else {
                // If the item already exists, you can choose to handle it in any way you prefer
                // For example, updating properties or merging data
                mergedArray[existingItemIndex] = { ...mergedArray[existingItemIndex], ...item };
            }
        });
    });

    return mergedArray;
}

////////////////////////////////////////////////////////////////////////////////
// Main functions
// Step 1: Deciding what channel name to use
const channelName = 'degen'
async function fetchChannelRankings (channelName = 'degen', offset = 0, limit = 100, lite = true) {
    const channelRankingsBaseURL = 'https://graph.cast.k3l.io/channels/rankings'
    const channelRankingsParameters = `offset=${offset}&limit=${limit}&lite=${lite}`
    const channelRankingsURL = `${channelRankingsBaseURL}/${channelName}?${channelRankingsParameters}`;
    const channelRankingsResponse = await fetch(channelRankingsURL, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        },
    });
    const channelRankedArrayResponse  = await channelRankingsResponse.json();
    const channelRankedArray = channelRankedArrayResponse.result;
    return channelRankedArray
}
let channelRankedArray = await fetchChannelRankings(channelName);
channelRankedArray = renameKey(channelRankedArray, 'rank', 'channelRank');
// console.log('Step 1 Channel Ranked Array: ', channelRankedArray);

// Step 2: Setting up array for input in to Bulk API
const constructingArrayForInputInToBulkAPI = channelRankedArray.map((channelRankedArray) => {
    return channelRankedArray.fid
})
// console.log('Step 2 Constructing Array for Input in to Bulk API: ', constructingArrayForInputInToBulkAPI);

// Step 3: Getting global rank for each of those users on Farcaster
async function fetchBulkGlobalRankings (fidsArray) {
    const globalRankingsBaseURL = 'https://graph.cast.k3l.io/scores/global/engagement/fids'
    const globalRankingsParameters = ``
    const globalRankingsURL = `${globalRankingsBaseURL}?${globalRankingsParameters}`
    const globalRankingsResponse = await fetch(globalRankingsURL, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(fidsArray)
    });
    const globalRankedArrayResponse  = await globalRankingsResponse.json()
    const globalRankedArray = globalRankedArrayResponse.result;
    return globalRankedArray
}
let globalRankedArray = await fetchBulkGlobalRankings(constructingArrayForInputInToBulkAPI);
globalRankedArray = renameKey(globalRankedArray, 'rank', 'globalRank');
// console.log('Step 2 Global Ranked Array: ', globalRankedArray);

// Step 4: Fetching user information from Farcaster Neynar API
async function fetchUserInfoBulk(fidsArray) {
    const chunkSize = 99;
    const neynarBaseURL = "https://api.neynar.com/v2/farcaster/user/bulk";

    let resultResponses = [];

    // Split the array into chunks of size 100
    for (let i = 0; i < fidsArray.length; i += chunkSize) {
        const chunk = fidsArray.slice(i, i + chunkSize);
        const suggestedFollowFIDsString = chunk.map(element => element).join(",");
        // console.log(suggestedFollowFIDsString);
        const neynarUserInfoParams = `fids=${suggestedFollowFIDsString}`;
        const neynarUserInfoURL = `${neynarBaseURL}?${neynarUserInfoParams}`;

        const result = await fetch(neynarUserInfoURL, {
            headers: {
                'Content-Type': 'application/json',
                api_key: process.env.NEYNAR_API_KEY
            }
        });

        const resultResponse = await result.json();
        const resultResponseUsers = resultResponse.users;
        resultResponses.push(resultResponseUsers);
    }

    return resultResponses;
}
const userInfoResponses = await fetchUserInfoBulk(constructingArrayForInputInToBulkAPI).then(res => res.flat(1));
// console.log('Step 4: User Info Responses: ', userInfoResponses);

// Step 5: Merging all the three arrays based on commpon FIDs
const mergedArray = mergeArrays(channelRankedArray, globalRankedArray, userInfoResponses);
// console.log('MERGED ARRAY: ', mergedArray);

// Spit out an Excel
arrayToExcel(mergedArray, 'output.xlsx', 'People');
