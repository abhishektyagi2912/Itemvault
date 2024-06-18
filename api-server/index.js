const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand, LaunchType } = require('@aws-sdk/client-ecs')
const { Server } = require('socket.io');
const Redis = require('ioredis');


const app = express()
app.use(express.json())
const port = 9000

const redis = new Redis('rediss://default:AVNS_cINJPsAsyryWoJKZ9QP@my-vercel-abhishektyagi2912-3801.h.aivencloud.com:13954')

const io = new Server({ cors: { origin: '*' } })
io.listen(9001, () => console.log('Socket server is running on port 9001'))

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('subscribe', (channel) => {
        socket.join(channel)
        socket.emit('message', `Joined to ${channel}`)
    })
    io.on('disconnect', () => {
        console.log('A user disconnected');
    })
})

const ecsClient = new ECSClient({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: 'AKIAUIDV4CHNAWZZBIGZ',
        secretAccessKey: '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'
    }
})

const config = {
    CLUSTER: 'arn:aws:ecs:eu-north-1:292304982490:cluster/builder-cluster-aws',
    TASK: 'arn:aws:ecs:eu-north-1:292304982490:task-definition/builder-task'
}

app.post('/project', async (req, res) => {
    const { gitUrl } = req.body
    const projectSlug = generateSlug()

    //spin the container with the projectSlug use npm install @aws-sdk/client-ecs
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: ['subnet-0de689a08d9a61735', 'subnet-0871de60c8290149d', 'subnet-04edeb6fac168d84a'],
                securityGroups: ['sg-02f94ecd4240d5e2e'],
                assignPublicIp: 'ENABLED'
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        {
                            name: 'GIT_REPOSITORY_URL',
                            value: gitUrl
                        },
                        {
                            name: 'PROJECT_ID',
                            value: projectSlug
                        }
                    ]
                }
            ]
        }
    })
    await ecsClient.send(command)
    return res.json({ status: 'Queued', data: { slug: projectSlug, url: `http://${projectSlug}.localhost:8000` } });
})

async function redisSubscribe() {
    console.log('Subscribing to logs')
    redis.psubscribe('logs:*')
    redis.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message)
    })
}

redisSubscribe()

app.listen(port, () => {
    console.log(`Api server is running on port ${port}`);
})