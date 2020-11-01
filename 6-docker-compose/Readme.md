# Docker Compose
## 1. Building a real application
In this step, we try to set up a complete web application. This web application is a very simple ToDo app that we can use it to add and remove todo items with it.
This web application consists of three services:
* Backend: we use java and spring to bring up an API for the todo app.
* Database: we use a MySQL server which is used by the backend service
* Frontend: we use vue.js to create the UI for our web app which uses the backend API.

Next, each service is explained:

### Backend Service
Our todo app has a simple CRUD API for tasks. Each task is just a text. This API can create or delete a task and also return the list of all tasks.

The spring framework is used here for creating the API. To start, first, we need to build our java project and create an executable jar file. 
First, head into the `backend` directory:
```
cd backend
```
For building the project we need to execute the `mvn clean package` command.
If you already have maven and java 11 installed on your machine, you can build the project on your machine:
```
mvn clean package
```
Otherwise, you can bring up a temporary `maven` container and build the project inside this container:
```
docker run --rm -v $(pwd):/home/backend repository -w /home/backend  maven:3.6.3-jdk-11 mvn clean package
```
> We have attached the current working directory as a volume to the maven container to have access to the backend source code in the container.
> Instead of getting shell access and executing the `mvn clean package`, we are directly executing the `mvn clean package` command on the container. 
> Using the`-w` option we can set the working directory for the command to be executed.

After building the project, we have a `todo-backend.jar` file in the target directory. Now, its time to write a docker file so we can run the backend API in a container:
```dockerfile
FROM openjdk:11
WORKDIR /home
COPY ./target/todo-backend.jar /home/todo-backend.jar
ENTRYPOINT java -jar todo-backend.jar
```
Since we want to run the jar file, we have set the base image to OpenJDK. Then we have copied the jar file into the image. Finally, we used the `ENTRYPOINT` instruction to run the jar file.
Now, let's build our image:
```
docker build -t todo-backend:v1 ./
```

### Frontend service
The frontend service has been written in vue.js. It has a simple page for viewing the list of todos, adding a new todo, and deleting todos. This application will use the backend API for manipulating the tasks.
For bringing up our vue.js application we first build the project and then we serve the generated static files using an Nginx image (like what we have done in step4). 
First, go to the frontend directory:
```
cd ../frontend
```
If you have node installed on your machine, you can simply execute the following command to build the project:
```
npm run build
```
Otherwise, again you can bring up a temporary node container and build the project inside that:
```
docker run --rm -v $(pwd):/frontend -w /frontend node:lts-alpine npm run build
```
The dist folder contains the compiled code of our web application. 
Next, we write the following `Dockerfile` for the frontend service:
```dockerfile
FROM nginx:1.19
COPY dist/ /usr/share/nginx/html/
```
As you can see, it is similar to what we have written in step4, we just needed to copy the dist folder to proper directory in the image and we are done. 

Finally, let's build the frontend image:
```
docker build -t todo-frontend:v1 ./
```
## 2. Starting the services
In this section, we try to bring up all the containers needed. We need a container for the backend, one for the frontend, and one for the database. 
To enable communications between the backend and MySQL containers, they must connect to at least one common network. To do so we first need to create a docker network:
```
docker network create todo-network
```
Next, we bring up the database container:
```
cd ../mysql
docker run -d --name mysql-server \
--network todo-network \
-e MYSQL_ROOT_PASSWORD=1234 \
-e MYSQL_DATABASE=todo \
-v $(pwd)/data:/var/lib/mysql \
-v $(pwd)/server.cnf:/etc/mysql/conf.d/server.cnf \
mysql
```
In this command, in addition to the root password, we set a database name that MySQL will create during initialization. We have connected the database to the `todo-network` using the `--network` option.
We also attached the `server.conf` file to configure the database settings. Since our backend service will run in a separate container, we are using this file to configure the mysql to accept connections from any host.

Next, we bring up the backend container:
```
docker run -d --name todo-backend-container \
--network todo-network \
-e MYSQL_SERVER_HOSTNAME=mysql-server \
-e MYSQL_SERVER_DATABASE_NAME=todo \
-e MYSQL_SERVER_USERNAME=root \
-e MYSQL_SERVER_PASSWORD=1234 \
-p 8080:8080 \
todo-backend:v1
```
Since the API needs a connection to the database, we need to specify the address of the database. We need an IP address or hostname. When working with docker, most of the time, it is not reasonable to use the IP address of the containers, since IP addresses are dynamically allocated by docker, so if some container is removed and added again it may be given a different IP. 
The better way is to use the hostname of the container. By default, docker sets the name of the container as its hostname. Hostnames assigned by docker, in the docker networks, are resolved to the corresponding container IP address. So because we named our database container `mysql-server` we can now use this name as the hostname of the MySQL container.
We also specified the username and password that we used when running the MySQL container so that the backend API be able to authenticate with the database.

And at last, we bring up the frontend container:
```
docker run -d --name todo-frontend-container -p 9090:80 todo-frontend:v1
```

You can now visit localhost:9090 and work with our simple todo app.
Remove all containers when you are done:
```
docker rm -f todo-backend-container todo-frontend-container mysql-server
```

## 3.Introducing docker compose!
We have now learned how to create images and containers. In this step, we also learned how to bring up multiple containers to shape up a complete service. For real-world applications, we have many services and we need to bring up a dozen containers. Even in our todo app example, we have needed to execute three commands and each of these commands was complex. Instead of executing these commands, we can use docker compose to alleviate this process. Docker compose is a tool for managing the lifecycle of multiple containers. Docker-compose is not a part of docker CLI, so it must be installed separately. 

Compose reads the configuration of multiple containers from a YAML file and then can manage all or each of them with the commands it provides. 

Let's see the docker compose file that we can use for the todo app:
```yml
version: "3.8"

services:
  mysql:
    container_name: "${DATABASE_HOSTNAME}"
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD: "${DATABASE_PASSWORD}"
      MYSQL_DATABASE: "${DATABASE_NAME}"
    volumes:
      - ./mysql/data:/var/lib/mysql
      - ./mysql/server.cnf:/etc/mysql/conf.d/server.cnf

  backend:
    container_name: todo-backend-container
    image: todo-backend:v1
    environment:
      MYSQL_SERVER_HOSTNAME: "${DATABASE_HOSTNAME}"
      MYSQL_SERVER_USERNAME: root
      MYSQL_SERVER_PASSWORD: "${DATABASE_PASSWORD}"
      MYSQL_SERVER_DATABASE_NAME: "${DATABASE_NAME}"
    ports:
      - 8080:8080

  frontend:
    container_name: todo-frontend-container
    image: todo-frontend:v1
    ports:
      - 9090:80
```
In the first line of the file, we must set the Compose file version that we want to use. 
Next, we define the configuration of each container, which is called a service in a Compose file. As you can see we are setting the same attributes of the container as we have used the docker run command. But this time they are structured and it's easier to modify them. 
We also used environment variables, e.g. DATABASE_USERNAME, for the values that are common between two or more containers. 
You may also have noticed that in the Compose file, we can now use relative paths for volumes.
Now let's use this file to bring up our todo app. 
First, change your working directory to step-6. Compose CLI assumes there is a `docker-compose.yml` file in the current directory. Also, instead of setting the environment variables in the command line, we can put them in a file named `.env`. Compose automatically picks up the variables in the `.env` file in the current directory and substitutes them.
Also, there is no need for creating a network and connecting each container to it. Compose by default creates a network and so that all services specified in the Compose file are on the same network.
Now, to bring up all the containers we just need to run:
```
docker-compose up -d
```
Like the `docker run` command, the `-d` option brings up the containers in the background. 
The `up` command is a shortcut for `create` and `start`. Docker compose have similar commands to the docker CLI, but the difference, and also the advantage here is that it only executes the command for the containers that have been specified in the Compose file. Here is a short description of these commands:
* `create`: Create the containers
* `start`: Start the containers
* `stop`: Stop the containers 
* `rm`: Remove the containers
* `up`: Create and start the containers
* `down`: Stop and remove the containers
* `restart`: Restart the containers
* `logs`: View logs of the containers
* `pull`: Pull images of the services
* `push`: Push images of the services
* `ps`: View status of the containers
You can also use the above command with the name single or multiple services to execute the command only for that services, for example, you can stop only the backend and frontend services:
```
docker-compose stop backend frontend
```
> Note that you can not use the container name here, but the service name. Service names are keys of the services dictionary in the YAML file.

Another useful command is `docker-compose config` which validates the docker-compose file and then prints it.

## 4. Building the images using Compose
For writing the Compose file in the previous section, we have used the images we have built in section 2. But building images also adds another manual step for bringing up our application. We can use Compose to automate the building of the images too.

Now we will use the following Compose file for the todo application:

```yml
version: "3.8"

services:
  mysql:
    container_name: "${DATABASE_HOSTNAME}"
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD: "${DATABASE_PASSWORD}"
      MYSQL_DATABASE: "${DATABASE_NAME}"
    volumes:
      - ./mysql/data:/var/lib/mysql
      - ./mysql/server.cnf:/etc/mysql/conf.d/server.cnf

  backend:
    container_name: todo-backend
    build: ./backend
    environment:
      MYSQL_SERVER_HOSTNAME: "${DATABASE_HOSTNAME}"
      MYSQL_SERVER_USERNAME: root
      MYSQL_SERVER_PASSWORD: "${DATABASE_PASSWORD}"
      MYSQL_SERVER_DATABASE_NAME: "${DATABASE_NAME}"
    ports:
      - 8080:8080

  frontend:
    container_name: todo-frontend
    build: ./frontend
    ports:
      - 9090:80
```

You can see that in this Compose file, we have removed the `image` property, and instead we have used the `build` property. Here we specified `build` for both frontend and backend services. The `build` property can be specified as a path of the build context. Since we have a `Dockerfile` in each of the frontend and backend directories, we passed these directories as the build context. Now we can instruct Compose to build our images before creating them. Hence, all of the build, creation, and start of our containers can be done using the following command:
```
docker-compose up -d --build
```
> Compose do not try to build the image if it had built the image before. So, if we want to force rebuilding of the image we must pass the `--build` argument.
