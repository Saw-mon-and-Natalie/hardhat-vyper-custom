import { ActionType } from "hardhat/types";

const preprocessFile = require("c-preprocessor").compileFile;
const fs = require("fs");
const tmp = require("tmp");
const path = require("path")

// Root directory of the project where `hardhat` command is executed
const ROOT_DIR = process.cwd();

/**
 * Creates a temporary file with a random name.
 * @returns a promise that resolves to an object containng `fd` the file
 * descriptor and `path` the path to the temporary file.
 */
const createTmpFile = async (): Promise<{ fd: number; path: string }> => {
  return new Promise((resolve, reject) => {
    tmp.file({ tmpdir: ROOT_DIR, dir: "tmp" }, function _tempFileCreated(
      err: any,
      path: string,
      fd: number,
      cleanupCallback: Function | undefined
    ) {
      if (err) reject(err);

      resolve({ path, fd });
    });
  });
};

/**
 * Preprocess a Vyper contract that uses C pragmas.
 * @param fileName The Path to the file
 * @returns A promise that would resolve into the preprocessed data
 */
const preprocess = async (fileName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    preprocessFile(fileName, { basePath: "" }, (err: any, result: any) => {
      if (err) {
        reject(err);
      }

      resolve(result);
    });
  });
};

/**
 * Preprocess the `filename` and save the result into a temporary file.
 * @param fileName The Path to the file for preprocesing
 * @returns a promise that resolves into the `path` to the preprocessed file.
 */
const preprocessAndCreateTmpFile = async (
  fileName: string
): Promise<string> => {
	// Preprocess `fileName`
  const result = await preprocess(fileName);

	// Create a temp file and write the result into.
  const { path, fd } = await createTmpFile();
  fs.write(
    fd,
    result,
    0,
    "utf-8",
    (err: Error, written: number, string: string) => {
      // console.log(err, written, string)
    }
  );

  return path;
};

/**
 * A hook to intercept the Vyper compilation, preprocess the contracts and then compile.
 * @param taskArgs arguments passed to this hook
 * @param _ unused Hardhat runtime environment variable.
 * @param runSuper the parent hook.
 * @returns `compiled` a JSON object created by `Vyper` command line.
 */
export const compileHook: ActionType<any> = async (taskArgs, _, runSuper) => {
    // Temp paths to write preprocessed files to.
	const tmpPaths = await Promise.all(
		taskArgs.inputPaths.map((fileName: string) => {
			return preprocessAndCreateTmpFile(fileName);
		})
	);

    // Save original input paths.
	const inputPaths = taskArgs.inputPaths;

    // Replace input paths by temp paths.
	taskArgs.inputPaths = tmpPaths;

    // Compile tmp preprocessed Vyper contracts using the parent hook
	const tmpCompiled = await runSuper(taskArgs);
	
    // Define a new compile object.
	const compiled: {[key: string]: object} = {}

    // Set the Vyper version
	compiled.version = tmpCompiled.version

    // Replace temp paths with the orginal input paths in the compiled
    // JSON objects.
	inputPaths.forEach((p: string, i: number) => {
		const relativePath = path.relative(ROOT_DIR, p).replaceAll(path.sep, '/')
		const relativeTmpPath = path.relative(ROOT_DIR, tmpPaths[i]).replaceAll(path.sep, '/')

		compiled[relativePath] = tmpCompiled[relativeTmpPath]
	})

    // Clean up temp files.
	tmp.setGracefulCleanup()

    // Return the compiled JSON object.
	return compiled;
}