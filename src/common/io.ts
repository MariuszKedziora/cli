import * as childProcess from 'child_process';
import * as fs from 'fs';
import rimrafCallback from 'rimraf';
import { Writable } from 'stream';
import { promisify } from 'util';

import { assertIsIOError } from './error';
import { SkipFileType } from './flags';

export const readFile = promisify(fs.readFile);
export const access = promisify(fs.access);
export const stat = promisify(fs.stat);
export const readdir = promisify(fs.readdir);
export const mkdir = promisify(fs.mkdir);
export const realpath = promisify(fs.realpath);
export const rimraf = promisify(rimrafCallback);

export interface WritingOptions {
  append?: boolean;
  force?: boolean;
  dirs?: boolean;
}

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
  } catch (err: unknown) {
    assertIsIOError(err);

    // Allow `ENOENT` because it answers the question.
    if (err.code === 'ENOENT') {
      return false;
    }

    // Rethrow other errors.
    throw err;
  }

  // No error, no problem.
  return true;
}

/**
 * Creates a directory without erroring if it already exists.
 * Returns `true` if the directory was created.
 */
export async function mkdirQuiet(path: string): Promise<boolean> {
  try {
    await mkdir(path);
  } catch (err: unknown) {
    assertIsIOError(err);

    // Allow `EEXIST` because scope directory already exists.
    if (err.code === 'EEXIST') {
      return false;
    }

    // Rethrow other errors.
    throw err;
  }

  return true;
}

/**
 * Returns `true` if the given path is a file.
 *
 * Uses the `stat` syscall (follows symlinks) and ignores the `ENOENT` error (non-existent file just returns `false`).
 */
export async function isFileQuiet(path: string): Promise<boolean> {
  try {
    const statInfo = await stat(path);

    return statInfo.isFile();
  } catch (err: unknown) {
    assertIsIOError(err);

    // allow ENOENT, which means it is not a directory
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  return false;
}

/**
 * Returns `true` if the given path is a directory.
 *
 * Uses the `stat` syscall (follows symlinks) and ignores the `ENOENT` error (non-existent directory just returns `false`).
 */
export async function isDirectoryQuiet(path: string): Promise<boolean> {
  try {
    const statInfo = await stat(path);

    return statInfo.isDirectory();
  } catch (err: unknown) {
    assertIsIOError(err);

    // allow ENOENT, which means it is not a directory
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  return false;
}

export function streamWrite(stream: Writable, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const writeMore = stream.write(data, 'utf-8');

    if (!writeMore) {
      stream.once('error', reject);
      stream.once('drain', resolve);
    } else {
      resolve();
    }
  });
}

export function streamEnd(stream: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once('error', reject);
    stream.once('close', resolve);
  });
}

export function execFile(
  path: string,
  args?: string[],
  execOptions?: fs.BaseEncodingOptions & childProcess.ExecFileOptions,
  options?: {
    forwardStdout?: boolean;
    forwardStderr?: boolean;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = childProcess.execFile(
      path,
      args,
      execOptions,
      (err, stdout, stderr) => {
        if (err) {
          reject({
            ...err,
            stdout,
            stderr,
          });
        } else {
          resolve();
        }
      }
    );

    if (options?.forwardStdout === true) {
      child.stdout?.on('data', chunk => process.stdout.write(chunk));
    }
    if (options?.forwardStderr === true) {
      child.stderr?.on('data', chunk => process.stderr.write(chunk));
    }
  });
}

export async function resolveSkipFile(
  flag: SkipFileType,
  files: string[]
): Promise<boolean> {
  if (flag === 'never') {
    return false;
  } else if (flag === 'always') {
    return true;
  } else {
    try {
      await Promise.all(files.map(file => access(file)));
    } catch (e) {
      // If at least one file cannot be accessed return false
      return false;
    }

    return true;
  }
}

/**
 * Returns `true` if directory or file
 * exists, is readable and is writable for the current user.
 */
export async function isAccessible(path: string): Promise<boolean> {
  try {
    await access(
      path,
      fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK
    );
  } catch (err: unknown) {
    assertIsIOError(err);

    if (err.code === 'ENOENT' || err.code === 'EACCES') {
      return false;
    }

    throw err;
  }

  return true;
}
