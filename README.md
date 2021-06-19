# Stream-automate

<p align="center"><i>
  Simple HTTP backend for OBS Control and Remote HotKey Input.
  <br>
  OBS 조작 및 단축키 입력을 원격으로 수행하기 위한 간단한 HTTP 서버 백엔드입니다.
  </i></p>

<p align="center">
    <b>Developed By</b> HLemonT
</p>



<p align="center"><b>
  <br>
  <a href="https://github.com/Palakis/obs-websocket">obs-websocket</a> | 
  <a href="https://github.com/obs-websocket-community-projects/obs-websocket-js">obs-websocket-js</a> | 
  <a href="https://github.com/octalmage/robotjs">robotjs</a></b>
</p><br>

<p align="center"><a href="#installation">Installation</a></p>
<p align="center"><a href="#Configuration">Configuration</a></p>
<p align="center"><a href="#API-Documentations">API Documentations</a></a></p>
<br/>

## Introduction

Stream-automate는 간단하게 DIY 자동화 방송 관리 시스템을 구성하고 싶은 사람들을 위한 프로그램입니다. HTTP API 요청을 이용하여, PC나 모바일의 웹페이지 혹은 프로그램, 제일 중요하게는 센서나 입력 장치가 달린 아두이노에 의해 특정 동작을 하게 만들 수 있습니다. 



아두이노에서 웹 요청 및 HTTP 요청을 보내기 위해서는 Wifi나 Ethernet 등을 지원하는 장치여야 하고, [ArduinoHttpClient](https://github.com/arduino-libraries/ArduinoHttpClient)와 같은 라이브러리를 이용하면 쉽게 구현해볼 수 있습니다. 특히, 이 [예제](https://github.com/arduino-libraries/ArduinoHttpClient/tree/master/examples) 중 SimpleGet이나 SimplePost를 이용하면 조금의 수정만으로도 구현이 가능할 것으로 보입니다.



현재는 장면 전환 기능, 송출 및 녹화 시작/정지 기능과 원격 조작 기능을 구현하고 있습니다만, 필요성과 가능성에 따라 추가될 예정입니다. 

<br/>

## Installation

1. Get the latest release of stream-automate from [releases](https://github.com/hlemont/stream-automate/releases) and follow the instructions.

2. Install OBS Websocket from [official site](https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-from-websockets.466).
3. Configure OBS Websocket, assigning port and password in the OBS.
4. Open `config.json` in the folder, and edit `"obs.address"`, `"obs.port"`, and `"obs.password"` as your environment.



1. [releases](https://github.com/hlemont/stream-automate/releases)에서 최신 버전의 릴리즈를 받고 안내한 절차에 맞춰 설치를 진행하세요
2. [OBS Websocket](https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-from-websockets.466)을 설치하세요.
3. OBS Websocket을 구성하고, 포트나 비밀번호를 필요에 따라 지정해 주세요.
4. 설치 폴더에 위치한 `config.json`을 편집기로 열고 `"obs.address"`, `"obs.port"`,  그리고 `"obs.password"`를 본인 상황에 맞게 설정해 주세요. 


<br/>

## Configuration

#### *config.json*: 

```
{
	"serverPort": 4445,
	"obs": {
        "address": "localhost",
        "port": 4444,
        "password": "1q2w3e4r",
        // alias for set Current Scene request
        "sceneAlias": {
            "exampleAlias": "ActualSceneName"
        }
    },
	"remote": {
        "allowed": true,
        "macros": {
            "macroName": [
    			// RemoteControl Object
            ]
        }
    }
}
```

#### obs

- `address`: IP address of OBS WebSocket server

  OBS 웹소켓 서버의 IP 주소

- `port`: port of OBS WebSocket server
  OBS 웹소켓 서버의 포트 번호

- `password`: password of OBS WebSocket server

  OBS 웹소켓 서버의 비밀번호

- `sceneAlias`:  alias for scene name

  장면 이름의 별칭

```
"sceneAlias": {
    [alias: string]: [sceneName: string]
}
```

> Scene names of `alias` in API Request, will be replaced with `sceneName`. And scene names of `sceneName` in API Response, will be replaced with first matching `alias`.
> API 요청의 장면 이름 중 `alias`인 것은 `sceneName`으로, API 응답의 장면 이름 중 `sceneName`인 것은 첫 번째 매치된 `alias`로 교체됩니다. 



#### remote

- `allowed`: whether to allow *RemoteControl* functionality

  RemoteControl 기능을 허용할지 여부

- `macros`: pre-definining macros

  매크로를 미리 정의함

```
"macros": {
    "macroName": [ RemoteControl[] ]
}
```

See: [API Documentation - RemoteControl](#RemoteControl)



<br/>

#  API Documentations

#### [**Typedef**](#Typedef)

- [RemoteControl](#RemoteControl)

#### [OBS](#OBS-2)

- [OBS/Scene](#OBS/Scene)

- [OBS/Stream](#OBS/Stream)

- [OBS/Record](#OBS/Record)

#### [Remote](#Remote-2)

- [Remote](#Remote-2)
- [Remote/Macro](#Remote/Macro)

<br/>

### Typedef

#### RemoteControl

```
// key: keyTapping
{
    "type": "key",
   	"key": string,
    "modifiers": string[],
}

// string: stringTyping
{
    "type": "string",
    "string": string
}

// delay: adding delay between RemoteControls in macro
{
    "type": "delay",
    "delay": ms
}
```

> Check [Robotjs API - keys](https://robotjs.io/docs/syntax#keys) for supported keys. `"modifiers"` accepts command, control, shift, alt.
> [Robotjs API - keys](https://robotjs.io/docs/syntax#keys)에서 지원되는 key 값을 확인해 주세요. `"modifiers"`는 command, control, shift, alt 키가 허용됩니다.

<br/>

## OBS

Control scene, streaming, and recording by OBS WebSocket

OBS WebSocket을 이용하여, 장면 및 스트리밍, 녹화 등을 조작합니다.

<br/>

### OBS/Scene

 API Calls for fetching and setting current scenes to switch between scenes.

장면을 전환하기 위한 API 호출입니다. 

#### Get Scene list

Returns total list of scene.

전체 Scene 목록을 반환합니다. 

| Title                | Get Scene List                                               |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/obs/scene`                                                 |
| **Method**           | **GET**                                                      |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | None                                                         |
| **Success Response** | **Code:** 200 OK <br />**Content: ** `{ "list": string[] }`  |
| **Error Response**   | **Code:** 500  INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

<br/>

#### Get Current Scene

Returns current scene.
현재 Scene을 반환합니다.

| Title                | Get Current Scene                                            |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/obs/scene/current`                                         |
| **Method**           | **GET**                                                      |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | None                                                         |
| **Success Response** | **Code:** 200 OK <br />**Content: ** `{ "name": [string] }`  |
| **Error Response**   | **Code:** 500 INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

<br/>

#### Set Current Scene

Sets current Scene.
현재 Scene을 설정합니다.

| Title                | Set Current Scene                                            |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/obs/scene/current`                                         |
| **Method**           | **POST**                                                     |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | name: *[string]*                                             |
| **Success Response** | **Code:** 204 No Content                                     |
| **Error Response**   | **Code**: 404 Not Found<br />**Content:** `{ "error": "requested scene does not exist"}` |
| **Error Response**   | **Code:** 500 INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

<br/>

### OBS/Stream

API Calls for fetching stream status and starting/stopping streaming.
방송 송출 상태를 가져오고 방송 송출을 시작 및 중지하기 위한 API 호출입니다.



#### Get Streaming Status

Returns Streaming Status.
방송 송출 상태를 반환합니다.

| Title                | Get Streaming Status                                         |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/obs/stream`                                                |
| **Method**           | **GET**                                                      |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | None                                                         |
| **Success Response** | **Code:** 200 OK <br />**Content: ** `{ "status": [StreamingStatus] }` |
| **Error Response**   | **Code:** 500 INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

* *StreamingStatus*: [obs-websocket docs](https://github.com/Palakis/obs-websocket/blob/4.x-current/docs/generated/protocol.md#getstreamingstatus)

  ```
  {
      "message-id": [string], 
      "preview-only": [boolean], 
      "recording": [boolean], 
      "recording-paused": [boolean], 
      "status": [string], 
      "streaming": [boolean], 
      "virtualcam": [boolean],
      "messageId": [string],
      "previewOnly": [boolean],
      "recordingPaused": [boolean]
  }
  ```

<br/>

#### Perform Streaming Action

Performs action of starting, stopping, toggling streaming.

방송 송출을 시작하고 멈추는 동작을 수행합니다.

| Title                | Perform Streaming Action                                     |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/obs/stream`                                                |
| **Method**           | **POST**                                                     |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | action: "start" \| "stop" \| "toggle"                        |
| **Success Response** | **Code:** 204 No Content                                     |
| **Error Response**   | **Code:** 400 Bad Request <br />**Content:** `{ "error": "unknown action: <action>"}` |
| **Error Response**   | **Code:** 500 INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

<br/>

### OBS/Record

API Calls for starting/stopping recording.

녹화를 시작 및 중지하기 위한 API 호출입니다.

#### Perform Recording Action

Performs action of starting, stopping, toggling recording 

녹화를 시작하고 멈추는 동작을 수행합니다.

| Title                | Perform Recording Action                                     |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/obs/record`                                                |
| **Method**           | **POST**                                                     |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | action: "start" \|"stop" \|"toggle"                          |
| **Success Response** | **Code:** 204 No Content                                     |
| **Error Response**   | **Code:** 400 Bad Request <br />**Content:** `{ "error": "unknown action: <action>"}` |
| **Error Response**   | **Code:** 500 INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

</br>

## Remote

Control PC remotely by simulating Keyboard inputs, etc. with Robot-js.

Robot-js를 이용하여 키보드 입력 등을 시뮬레이션하고, PC를 원격으로 조종합니다.



#### Run Control

Simulates user requested control.

사용자가 요청한 조작을 시뮬레이션합니다. 

| Title                | Run Control                                                  |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/remote/control`                                            |
| **Method**           | **POST**                                                     |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | control: [RemoteControl]                                     |
| **Success Response** | **Code:** 204 No Content                                     |
| **Error Response**   | **Code:** 400 Bad Request<br />**Content:** `{ "error": "required field control missing"}` |
| **Error Response**   | **Code:** 400 Bad Request<br />**Content:** `{ "error": "invalid control: <control>"}` |
| **Error Response**   | **Code:** 500 INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

<br/>

### Remote/Macro

#### Run User Macro

Simulates user requested macro, a simultaneous control.

사용자가 요청한 매크로, 즉 연속된 조작을 시뮬레이션합니다.

| Title                | Run User Macro                                               |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/remote/macro`                                              |
| **Method**           | **POST**                                                     |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | macro: [ RemoteControl[] ]                                   |
| **Success Response** | **Code:** 204 No Content                                     |
| **Error Response**   | **Code:** 400 Bad Request<br />**Content:** `{ "error": "required field macro missing"}` |
| **Error Response**   | **Code:** 400 Bad Request<br />**Content:** `{ "error": "invalid macro: <macro>"}` |
| **Error Response**   | **Code:** 500 INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

<br/>

#### Get Pre-defined Macro list

Returns a list of macro pre-defined in config.

설정 파일에 미리 정의된 매크로의 목록을 반환합니다.

| Title                | Get Pre-defined Macro list                                   |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/remote/macro`                                              |
| **Method**           | **GET**                                                      |
| **URL Parameters**   | None                                                         |
| **Data Parameters**  | None                                                         |
| **Success Response** | **Code:** 200 OK <br />**Content: ** `{ "macros": { [macroname]: RemoteControl[] } }` |
| **Error Response**   | **Code:** 500 INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

<br/>

#### Get Pre-defined Macro

Returns a macro pre-defined in config.

설정 파일에 미리 정의된 매크로를 반환합니다.

| Title                | Get Pre-defined Macro                                        |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/remote/macro/:name`                                        |
| **Method**           | **GET**                                                      |
| **URL Parameters**   | name: [string]                                               |
| **Data Parameters**  | None                                                         |
| **Success Response** | **Code:** 200 OK <br />**Content: ** `{ "macro": [ RemoteControl[] ] }` |
| **Error Response**   | **Code:** 404 Not Found<br />**Content:** `{ "error": "macro not found: <name>"}` |
| **Error Response**   | **Code:** 500  INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |

<br/>

#### Run Pre-defined Macro

Simulates a macro pre-defined in config.

설정 파일에 미리 정의된 매크로를 시뮬레이션합니다.

| Title                | Run Remote Control                                           |
| -------------------- | ------------------------------------------------------------ |
| **URL**              | `/remote/macro/:name`                                        |
| **Method**           | **POST**                                                     |
| **URL Parameters**   | name: [string]                                               |
| **Data Parameters**  | None                                                         |
| **Success Response** | **Code:** 204 No Content                                     |
| **Error Response**   | **Code:** 404 Not Found<br />**Content:** `{ "error": "macro not found: <name>"}` |
| **Error Response**   | **Code:** 500  INTERNAL SERVER ERROR <br />**Content:** `{ "error": [string] }` |



