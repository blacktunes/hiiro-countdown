import asyncio
import json
from datetime import datetime

import requests
import websockets


def log(*args):
    print(datetime.now().strftime('%Y-%m-%d %H:%M:%S'), *args)


CLIENTS = []
FANS = -1

TIMES = 0


def clear(ws):
    return ws.closed == False


FLAG = False


async def set_fans():
    global CLIENTS
    global FANS
    global TIMES

    while FLAG:
        s = getfans()

        if FANS != s:
            log('粉丝数改变:', FANS, ' -> ', s)
            FANS = s

            for ws in CLIENTS:
                try:
                    if ws.closed == False:
                        await ws.send(str(FANS))
                except:
                    pass

        CLIENTS = list(filter(clear, CLIENTS))

        TIMES += 1
        log('轮询次数:', TIMES, '粉丝数:', s, '连接数:', len(CLIENTS))

        await asyncio.sleep(1)

        if len(CLIENTS) <= 0:
            stop_get()


async def start_get():
    global FLAG

    if FLAG == True:
        return

    log('开始轮询')

    FLAG = True

    await set_fans()


def stop_get():
    log('结束轮询')

    global FLAG

    if FLAG == False:
        return

    FLAG = False


def getfans():
    # up主的uid
    uid = 508963009
    # 获取API的数据
    headers = {
        # 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate',
        'accept-language': 'zh-CN,zh;q=0.9',
        'referer': 'https://www.bilibili.com/',
        'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36',
    }

    res = -1
    try:
        data = requests.get(
            'https://api.bilibili.com/x/relation/stat?vmid=' + str(uid), headers=headers)
        # 将数据转为JSON格式

        info = json.loads(data.text)
        # print(info)

        if 'data' in info:
            res = info['data']['follower']
        else:
            log('获取数据失败')
            res = 0
    except:
        log('请求网络错误')
        res = 0

    return res


async def echo(websocket, path):
    CLIENTS.append(websocket)
    log('新增连接', '连接数:', len(CLIENTS))

    if FANS != -1:
        await websocket.send(str(FANS))

    await start_get()

    while True:
        try:
            await websocket.recv()
        except websockets.exceptions.ConnectionClosed:
            break

print(datetime.now().strftime('%Y-%m-%d %H:%M:%S'), ' 开始监听')

start_server = websockets.serve(echo, '127.0.0.1', 5002)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
