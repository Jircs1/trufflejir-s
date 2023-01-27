import Config from "@truffle/config";
import path from "path";
import fs from "fs";

export class Cache {
  private compilerCachePath: string;
  public memoizedCompilers: Map<string, string>;

  constructor() {
    const compilersDir = path.resolve(
      Config.getTruffleDataDirectory(),
      "compilers"
    );
    const compilerCachePath = path.resolve(compilersDir, "node_modules"); // because babel binds to require & does weird things
    if (!fs.existsSync(compilersDir)) fs.mkdirSync(compilersDir);
    if (!fs.existsSync(compilerCachePath)) fs.mkdirSync(compilerCachePath); // for 5.0.8 users

    this.compilerCachePath = compilerCachePath;
    this.memoizedCompilers = new Map();
  }

  list() {
    return fs.readdirSync(this.compilerCachePath);
  }

  add(code: string, fileName: string) {
    const filePath = this.resolve(fileName);
    fs.writeFileSync(filePath, code);
    this.memoizedCompilers.set(filePath, code);
  }

  has(fileName: string) {
    const filePath = this.resolve(fileName);
    return fs.existsSync(filePath);
  }

  loadFile(fileName: string): string {
    const filePath = this.resolve(fileName);
    if (this.memoizedCompilers.has(filePath)) {
      return this.memoizedCompilers.get(filePath)!;
    }
    try {
      const compiler = fs.readFileSync(filePath).toString();
      this.memoizedCompilers.set(filePath, compiler);
      return compiler;
    } catch (error) {
      if (!error.message.includes("ENOENT: no such file")) {
        throw error;
      } else {
        throw new Error("The file specified could not be found.");
      }
    }
  }

  resolve(fileName: string) {
    return path.resolve(this.compilerCachePath, fileName);
  }
}
