const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand, LaunchType } = require('@aws-sdk/client-ecs')
const { Server } = require('socket.io');
const Redis = require('ioredis');


const app = express()
app.use(express.json())
const port = 9000

const redis = new Redis('')

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
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const config = {
    CLUSTER: '',
    TASK: ''
}

app.post('/project', async (req, res) => {
    // const { gitUrl } = req.body      //gitUrl is the url of the git repository and every time in this new url is generated then  instead of this we can use the same url and the same project will be updated
    const { gitUrl, slug } = req.body
    const projectSlug = slug ? slug : generateSlug()   // then set the change data to the projectSlug

    //spin the container with the projectSlug use npm install @aws-sdk/client-ecs
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: ['', '', ''],
                securityGroups: [''],
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
