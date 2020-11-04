# Overview

The LoopBack storage component makes it easy to upload and download files to cloud storage providers and the local (server) file system. It has Node.js and REST APIs for managing binary content in cloud providers, including:

# Porting

This is a port of the origin loopback3 design to work with loopback4.

- Remplacer Container Model Model par un service
  - Utilisé un bindings pour l'implémentation utilisé
  - Bindings pour un provider pour modifié les noms de fichiers
- Remplacer le controller
- Component

- Fonctionnalité suivantes:
  - Middleware pour faire des transformations sur les fichiers downloader et uploader seulement plusieurs conditions comme type de fichier et autre.
  - Ajouter des metadata supplémentaire dans sur les fichiers uploader dans une table de la base de donnée pour savoir des trucs comme owner et etc ...

# Containers and files

The storage component organizes content as containers and files. A container holds a collection of files, and each file belongs to one container.

Container groups files, similar to a directory or folder. A container defines the namespace for objects and is uniquely identified by its name, typically within a user account. NOTE: A container cannot have child containers.

File stores the data, such as a document or image. A file is always in one (and only one) container. Within a container, each file has a unique name. Files in different containers can have the same name. By default, files with the same name will overwrite each other.

<table >
  <thead>
    <tr>
      <th>Description</th>
      <th width="320">Container Model Method</th>
      <th>REST URI</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>List all containers.</td>
      <td>
        getContainers(cb)
      </td>
      <td>GET<br>/api/containers</td>
    </tr>
    <tr>
      <td>Get information about specified container.</td>
      <td>getContainer(container, cb)</td>
      <td>GET<br>/api/containers/:container</td>
    </tr>
    <tr>
      <td>Create a new container.</td>
      <td>createContainer(options, cb)</td>
      <td>POST<br>/api/containers</td>
    </tr>
    <tr>
      <td>Delete specified container.</td>
      <td>destroyContainer(container, cb)</td>
      <td>DELETE<br>/api/containers/:container</td>
    </tr>
    <tr>
      <td>List all files within specified container.</td>
      <td>getFiles(container, download, cb)</td>
      <td>GET<br>/api/containers/:container/files</td>
    </tr>
    <tr>
      <td>Get information for specified file within specified container.</td>
      <td>getFile(container, file, cb)</td>
      <td>GET<br>/api/containers/:container/files/:file</td>
    </tr>
    <tr>
      <td>Delete a file within a given container by name.</td>
      <td>removeFile(container, file, cb)</td>
      <td>DELETE /api/containers/:container/files/:file</td>
    </tr>
    <tr>
      <td>Upload one or more files into the specified container. The request body must use multipart/form-data which is the file input type for HTML uses.</td>
      <td>upload(container, req, res, cb)</td>
      <td>POST<br>/api/containers/:container/upload</td>
    </tr>
    <tr>
      <td>Download a file within specified container.</td>
      <td>download(container, file, req, res, cb)</td>
      <td>GET<br>/api/containers/:container/download/:file</td>
    </tr>
    <tr>
      <td>Get a stream for uploading.</td>
      <td>uploadStream(container, file, options, cb)</td>
      <td>&nbsp;</td>
    </tr>
    <tr>
      <td>Get a stream for downloading.</td>
      <td>downloadStream(container, file, options, cb)</td>
      <td>&nbsp;</td>
    </tr>
  </tbody>
</table>