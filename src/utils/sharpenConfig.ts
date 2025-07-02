export const SERVERS = ['fathomvoice', 'fathomrb'];

export const DATABASES: { [key: string]: string[] } = {
    fathomvoice: ['fathomQueues', 'sipMonitor'],
    fathomrb: ['fathomrb'],
};

export const TABLES: { [key: string]: string[] } = {
    fathomQueues: ['queueCDR', 'queueCDRLegs', 'queueADR', 'queueAgents'],
    sipMonitor: ['sipLatency', 'sipLatencyTotals'],
    fathomrb: ['userGroups'],
};

export const QUERY_TEMPLATES = {
    agentStatus: (username?: string) => ({
        endpoint: "V2/queues/getAgentStatus/",
        payload: {
        username: username,
        }
    }),
    liveStatus: () => ({
        endpoint: "V2/query/",
        payload: {
        method: "query",
        q: `
            SELECT
            \`queueCallManagerID\`, \`queue\`.\`queueName\` AS "Logged in Qs",
            \`queueCallManager\`.\`answerTime\` AS "Answer Time",
            \`username\`,
            SEC_TO_TIME(UNIX_TIMESTAMP(NOW())-UNIX_TIMESTAMP(\`lastStatusChange\`)) AS "Status duration",
            SUM(\`lastStatusChange\` >= NOW() - INTERVAL 12 HOUR AND paused = 1 AND status = "active") AS "Paused Agents",
            SUM(\`lastStatusChange\` >= NOW() - INTERVAL 12 HOUR AND status != "offline" AND status != "active") AS "Interacting Agents",
            SUM(\`lastStatusChange\` >= NOW() - INTERVAL 12 HOUR AND paused = 0 AND status = "active") AS "Available Agents",
            SUM(\`status\` != "offline" AND \`lastStatusChange\` >= NOW() - INTERVAL 12 HOUR) AS "Active Agents",
            \`queueCallManager\`.\`commType\` AS "Interaction Type",
            \`callType\`, \`pauseReason\`, \`paused\`, FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(NOW())/(5))*(5)) AS "intervals"
            FROM \`fathomvoice\`.\`fathomQueues\`.\`queueAgents\`
            GROUP BY \`queueCallManagerID\`
            LIMIT 5000 UNION (SELECT null, null, null, null, null, null, null, null, null, null, null, null, null,
            FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(NOW())/(5))*(5)) AS "intervals")
            LIMIT 1
        `,
        global: false
        }
    }),
    cdrReport: (server: string, database: string, table: string, startDate: string, endDate: string) => ({
        endpoint: "V2/query/",
        payload: {
        method: "query",
        q: `
            SELECT
            queueCallManagerID, answerTime, endTime, agentName, waitTime, agentTalkTime, agentHoldTime, wrapup, segmentNumber, queueName, username, transferToData, commType
            FROM ${server}.${database}.${table}
            WHERE endTime BETWEEN '${startDate}' AND '${endDate}'
        `,
        }
    }),
    customSqlQuery: () => ({
        payload: {
        method: "query",
        }
    }),
    getAgents: (params: {
        getActiveCalls?: boolean;
        getDayCallCount?: boolean;
        queueLogin?: boolean;
        onlineOnly?: boolean;
        orderBy?: 'asc' | 'desc';
        orderByCol?: string;
    }) => ({
        endpoint: "V2/queues/getAgents/",
        payload: {
        ...params,
        }
    }),
    getCdrDetails: (uniqueID: string) => ({
        endpoint: 'V2/queues/getCdrDetails/',
        payload: {
        queueCallManagerID: uniqueID,
        getRecording: "false", // No solicitar la grabación directamente aquí
        getNotes: "",
        getTranscription: "",
        }
    }),
};

export default {
    QUERY_TEMPLATES,
    DATABASES,
    TABLES,
    SERVERS
}