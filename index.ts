import express from 'express';
import process from 'process';
import { loadConfig } from "./app/config";
import Server from './app/Server';

process.title = "OBSRouter";
const config = loadConfig();
console.log(JSON.stringify(config, undefined, 1));

const app = express();
const server = new Server(app);
server.start(config.general.serverPort)