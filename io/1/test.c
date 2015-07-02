#include <stdio.h>
#include <stdlib.h>
#include <emscripten.h>

#define BUFFER_SIZE 100

int main(int argc, char* argv[]) {
	int i;
	char *src, *dest;
	FILE *srcFile, *destFile;
	char *buffer = malloc(BUFFER_SIZE);
	int numRead;

	printf("Number of arguments: %d\n",argc);
	for (i = 0; i < argc; i++)
		printf("argument: %s\n",argv[i]);

	src = argv[1];
	dest = argv[2];

	printf("The source file is: %s\n",src);
	printf("The destination file is: %s\n",dest);


EM_ASM(
// FS.mkdir('/tmp');
FS.mount(JAVAFS,{root:'/tmp'},'/tmp');
);

	srcFile = fopen(src, "r");
	if (srcFile == NULL)
		printf("Failed to open: %s\n",src);
	destFile = fopen(dest,"w");
	if (destFile == NULL)
		printf("Failed to open: %s\n",dest);

	if (srcFile && destFile) {
		printf("Both files opened, doing the copy now\n");
	
		while (!feof(srcFile) && !ferror(srcFile) && !ferror(destFile)) {
			int numRead = fread(buffer, 1, BUFFER_SIZE, srcFile);
			if (numRead > 0)
				fwrite(buffer, 1, numRead, destFile);
		}
		printf("The copy finished\n");
	}

	if (!srcFile)
		fclose(srcFile);
	if (!destFile)
		fclose(destFile);

	return 5;
}
