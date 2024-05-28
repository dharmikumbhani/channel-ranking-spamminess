# Channel Ranking Spaminess
This is a simple repository that stitches OpenRanks channel rankins APIs + OpenRanks Global Ranking APIs and finally retrieves more information about each of the user using Neynars API to get information on all the ranked users withing a channel which then exports a xlsx file with all of these information seperated by columns to eyeball the spaminess of the users' channel rankings within the channel.

## Steps to run
1. Clone the repository
2. Install the requirements using `npm install`
3. Run the script using `node index.js`

## Parameters
in INdex.js you can change the following parameters:

| Parameter | Description |
| ---- | -------- |
| `channelName` | The name of the channel to get the rankings for. You can find this on the Line:53 of the index.js file |

## Output
The output is a xlsx file with the following columns:

| fid | channelRank | fname | username | globalRank | followerCount | followingCount | powerBadgeHolder |
| ---- | -------- | ------- | ---- | --------- | --------------- | --------------- |--------------- |

## License
MIT