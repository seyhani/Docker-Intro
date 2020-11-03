# Building more advanced images

## 1. How do containers used in practice?
Most containers are used to run specific applications. For example, an Nginx container has all its dependencies installed on a Linux distribution and then it runs the Nginx server, each time you create and start the container. There is no need to directly access the container with shell and run a bunch of commands to start the Nginx server. Instead, the Nginx image itself contains instructions to do this for us.

Let's create an Nginx container:
```
docker run --name nginx-container --rm -d -p 8080:80 nginx
```
Here `-d` options forces the container to run in the background.

The `-p` option binds a container port to a host machine port, here we are binding the port `8080` of the host to the port `80` of the container.

If you list the containers, you can see that your Nginx container is up and running:
```
docker container ls
```
Now if you visit `localhost:8080` you can see the default welcome page of the Nginx:
```
curl localhost:8080
```
Remove the Nginx container when you are done:
```
docker rm -f nginx-container
```

Now, let's experiment. First, start a container with the `ubuntu-with-greeting` image we have built in the previous step:
```
docker run -d --name greeting-container ubuntu-with-greeting:v2
```
Next, list the containers:
```
docker container ls
```
Seems strange, there is no sign of our greeting container! The `container ls` command only lists the running containers. Using the `-a` option you can list all containers including stopped ones, so let's try it:
```
docker container ls -a
```
Now you can see the greeting container.
Its status says that it has been exited, so it's no longer running.
Okay, lets start the container again:
```
docker start greeting-container
docker container ls -a
```
Again, you see that the container has been exited! We will see the cause of this behavior in the next section.

Remember to remove the container:
```
docker rm -f greeting-container
```

## 2. Entrypoint
We can build images for running a single specific application. So, after installing dependencies and setting up the environment, we finally need to start the application. For example, in the case of the Nginx image, there is an instruction in its `Dockerfile` which results in the starting of the Nginx server, each time you start the container. Now, let's create an image that runs an application. 
### Pinger
We will build an image which has the responsibility of continuously pinging the google.com.
Let's use the following `Dockerfile`:
```dockerfile
FROM ubuntu:20.04
RUN apt update
RUN apt install iputils-ping -y
ENTRYPOINT ping google.com
```
Here, we use Ubuntu as the base image, and then we have installed the ping utility. Finally, we need to make the image start pinging google if we start the container. This can be done using the `ENTRYPOINT` instruction.
```dockerfile
ENTRYPOINT command param1 param2
```
As you can see it runs a command like the `RUN` instruction, but, the difference here is that it runs the specified command only when the container is started. As the name suggests, its an entrypoint to our container when we start it. 
```dockerfile
ENTRYPOINT ping google.com
```
So with the above instruction we have instructed the image to run the ping command when the container starts.
Now, let's build and run the pinger.
First, head to `step4` directory and build the image:
```
cd pinger
docker image build -t pinger:v1 ./
```
And then run a pinger container:
```
docker run -d --name pinger-container pinger:v1
```
Next, you can see that the container is up and running:
```
docker container ls
```
Now, lets check whether the container is working properly by observing its logs:
```
docker logs -f pinger-container
```
With `-f` we instruct the `logs` command to follow the logs, which means that it continuously checks the logs and prints them in the stdout.

When you are done, delete the container:
```
docker rm -f pinger-container
```

## 3. Building a more advanced image
Let's build another image. In this section we build a custom Nginx image which serves our static website.
We use the following HTML file for the homepage of our website.
```html
<html>
<body>
    <h1>
        Welcome to my website!
    </h1>
</body>
</html>
```
Next, we use Nginx as the base image for building our custom image for serving our HTML page. Nginx starts a web server that listens on port 80 and, by default, serves the content resides in the `/usr/share/nginx/html/` directory. So, after setting the base image to Nginx, we will copy the `index.html` file to this directory. To do so, we use `COPY` instruction.
```dockerfile
COPY <src>... <dest>
```
By using `COPY`, our dockerfile becomes like this:
```dockerfile
FROM nginx:latest
COPY ./index.html /usr/share/nginx/html/
```
You may have noticed that we have used a relative path for `index.html`. For the `COPY` instruction, src can be paths of files in the context. The context is a directory of files used during the image building process, which we must pass to `image build` command. 

To see this in action, head to the `website` directory. Here we have `Dockerfile` and `index.html` files. Next, let's build the image:
```
cd ../website
docker image build -t website:v1 ./
```
In the command above we have passed the `./` as the context. Using this context, we have access to this directory during the build process, so we can use `./index.html` as the src argument for the `COPY` instruction.
You can put any other files or directories in the context and access them during the build.

Finally, start the container of our simple website image:
```
docker run -d --name website-container -p 8080:80 website:v1
```
We have used `-p` to bind the port 8080 of the host to the port 80 of the container, which is the one that Nginx listens on. Next, if you access the localhost:8080 you can see the content of your index.html:
```
curl localhost:8080
```
When you are done, remove the container:
```
docker rm -f website-container
```
