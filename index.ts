import express from 'express';
import process from 'process';
import { Server } from './app/Server';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const app = express();
const server = new Server(app, config);
process.title = "OBSRouter";
server.start(config.serverPort)