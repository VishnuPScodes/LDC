import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import type {NextFunction,Request,Response} from 'express';

const syllabusPath=fileURLToPath(new URL('../data/syllabus.json',import.meta.url));

export function loadSyllabus(){return JSON.parse(fs.readFileSync(syllabusPath,'utf8'))}

export function syllabusHandler(_req:Request,res:Response,next:NextFunction){
 try{return res.json(loadSyllabus())}
 catch(error){return next(error)}
}
