# Introduction to Dockerfile

## 1. What is Dockerfile
The more convenient way to build docker images is to using `Dockerfile`. 
With a `Dockerfile`, you write instructions needed for building the image. This feature gives you the ability to modify the image whenever it is needed.

Here is an example of a simple `Dockerfile`, which builds an image similar to the one we made in the previous step:
```dockerfile
FROM ubuntu:20.04
WORKDIR /home
RUN touch greeting.txt
RUN echo "Hello" > greeting.txt
``` 

## 2. Dockerfile Syntax
A `Dockerfile` has the following syntax:
```dockerfile
# Comment
INSTRUCTION arguments
```
Docker runs each instruction in the `Dockerfile` to build the image.
Next, we get familiar with the most important instructions.
### FROM
```dockerfile
FROM <image>
```
Each Dockerfile must start with a
`FROM` instruction. It sets the base image for the image we are trying to build. For instance, in the example in the previous section, we have used the `ubuntu` as the base image. 

### RUN
```dockerfile
RUN <command>
```
The `RUN` instruction, executes the given command on the image.  
For example, we have used `RUN` instruction to create a file an put the message inside it:
```dockerfile
RUN touch greeting.txt
RUN echo "Hello" > greeting.txt
```

### WORKDIR
```dockerfile
WORKDIR /path/to/workdir
```
By using the `WORKDIR` instruction you can set the working directory inside the image for the other instructions following this line. You can think of `WORKDIR` as the `cd` command counterpart in a `Dockerfile`. 
For example, you can set the working directory to `/home` and then create a text file there:
```dockerfile
WORKDIR /home
RUN touch greeting.txt
```

## 3. Building an image from dockerfile
Building images using a `Dockerfile` can be done using the `build` command:
``` 
docker build [OPTIONS] PATH | URL | -
```

The `build` command accepts a path for the **context** of the build. The context is a directory with a set of files that docker uses for building the image. By default, docker requires a file named `Dockerfile` in the context. Other files in the context are available for use during the image build process. 

Let's build a new version of the `ubuntu-with-greeting`, this time, using a `Dockerfile`. First, change your working directory to `3-dockerfile` and run the following command to build the image:
```
docker image build -t ubuntu-with-greeting:v2 ./
```
Here we are specifying the current working directory (`./`) as the context path. We also tagged our image with `ubuntu-with-greeting:v2` using `-t` option. 

Now, if we run a container of this image:
```
docker run --rm -it ubuntu-with-greeting:v2 bash
```
> `--rm` option tells docker engine to remove the container after it has been stopped. This option can be useful when you want temporary containers to do some experiment with an image.

Then we can see that it has a greeting file in its `home` directory:
```
ls /home
cat /home/greeting.txt
```
Finally, exit the shell when you are done:
```
exit
```