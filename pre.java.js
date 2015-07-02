
var orig_Math_abs = Math.abs;
Math.abs = function (x) {
        if (x == java.lang.Integer.MIN_VALUE)
                return java.lang.Integer.MAX_VALUE;
        else
                return orig_Math_abs(x);
}
var JAVAFS={isWindows:false,staticInit:function () {
        JAVAFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
              return JAVAFS.createNode(null, '/', JAVAFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
	if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
		throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = JAVAFS.node_ops;
        node.stream_ops = JAVAFS.stream_ops;
        return node;
      },getMode:function (path) {
      // mode has two kinds of information: 
      // the file type code
      // the access permission bit
      
      // first the permissions
      	var p = java.nio.file.Paths.get(path);
	var f = Java.type('java.nio.file.Files');
	var exists = f.exists(p);
	if (!exists)
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);

	var permissions = f.getPosixFilePermissions(p);
	var mode = 0;
	for each (var x in permissions) {
		if (x == java.nio.file.attribute.PosixFilePermission.GROUP_EXECUTE)
			mode = mode | 0010;
		if (x == java.nio.file.attribute.PosixFilePermission.GROUP_READ)
			mode = mode | 0040;
		if (x == java.nio.file.attribute.PosixFilePermission.GROUP_WRITE)
			mode = mode | 0020;
		if (x == java.nio.file.attribute.PosixFilePermission.OTHERS_EXECUTE)
			mode = mode | 0001;
		if (x == java.nio.file.attribute.PosixFilePermission.OTHERS_READ)
			mode = mode | 0004;
		if (x == java.nio.file.attribute.PosixFilePermission.OTHERS_WRITE)
			mode = mode | 0002;
		if (x == java.nio.file.attribute.PosixFilePermission.OWNER_EXECUTE)
			mode = mode | 0100;
		if (x == java.nio.file.attribute.PosixFilePermission.OWNER_READ)
			mode = mode | 0400;
		if (x == java.nio.file.attribute.PosixFilePermission.OWNER_WRITE)
			mode = mode | 0200;
	}

	// and now the type code
	var isDir = f.isDirectory(p);
	if (isDir) {
		mode = mode | 0040000; //  S_IFDIR
	}
	var isRegularFile = f.isRegularFile(p);
	if (isRegularFile) {
		mode = mode | 0100000; // S_IFREG
	}
	// TODO add some more type codes
        return mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in JAVAFS.flagsToPermissionStringMap) {
          return JAVAFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
      	throw 'called: getattr';
        },setattr:function (node, attr) {
	// noop for now
        },lookup:function (parent, name) {
	var path = PATH.join2(JAVAFS.realPath(parent), name);
	var mode = JAVAFS.getMode(path);
	return JAVAFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = JAVAFS.createNode(parent, name, mode, dev);
	  // TODO actually create and if truncate mode is set then also empty the the file 
	  return node;
        },rename:function (oldNode, newDir, newName) {
	print('called: rename');
	throw 'called: rename';
        },unlink:function (parent, name) {
	print('called: unlink');
	throw 'called: unlink';
        },rmdir:function (parent, name) {
	print('called: rmdir');
	throw new 'called: rmdir';
        },readdir:function (node) {
	print('called: readdir');
	throw new 'called: readdir';
        },symlink:function (parent, newName, oldPath) {
	print('called: symlink');
	throw new 'called: symlink';
        },readlink:function (node) {
	print('called: readlink');
	throw new 'called: readlink';
        }},stream_ops:{open:function (stream) {

	var path = JAVAFS.realPath(stream.node);
            if (FS.isFile(stream.node.mode)) {
	    	// open the file with the correct flags
		var mode;
		if (stream.flags == 0)
			mode = 'r';
		else
			mode = 'rw';
		
	    	// open the file and get an integer for the file
		stream.javaFile = new java.io.RandomAccessFile(path,mode);
            }
        },close:function (stream) {
	stream.javaFile.close();
	stream.javaFile = null;
        },read:function (stream, buffer, offset, length, position) {

	if (length < 1) return 0; // nothing to do

	var ByteArray = Java.type('byte[]');
	var javaBuffer = new ByteArray(length);
	var numBytesRead = stream.javaFile.read(javaBuffer,0,length);
            for (var i = 0; i < numBytesRead; i++) {
	    	buffer[offset + i] = javaBuffer[i];
	    }
	    if (numBytesRead == -1)
	    	return 0;
	return numBytesRead;
        },write:function (stream, buffer, offset, length, position) {
	if (length > 0) { // ensure there work to do
		var ByteArray = Java.type('byte[]');
		var javaBuffer = new ByteArray(length);
        	    for (var i = 0; i < length; i++) {
	    		javaBuffer[i] = buffer[offset + i];
		    }
			stream.javaFile.write(javaBuffer);
		}
        },llseek:function (stream, offset, whence) {
	throw new 'called: llseek';
        }}};
 


