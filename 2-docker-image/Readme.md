# Docker images

## 1. Working with images
Docker containers are created from docker images. Each docker image can be thought of as a template for creating a container. For example, we have used the `ubuntu` image in the previous step to create a container.

Docker needs images to be stored locally on the host machine to be able to create containers from them.
You can list the images exists on your host using `image` command:
```
docker image ls
```
Each docker image has a unique id. Also, each image can be identified with a name and a tag. For example, the name of the image we used in the previous step was `ubuntu` and its tag was `20.04`. Docker provides mechanisms for tagging images. So by tagging an image with a version number, various versions of an image can be differentiated. After executing the `docker image ls` command you can see the name (which is shown in the repository column), tag, and id of each image. 
```
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
ubuntu              20.04               d70eaf7277ea        7 days ago          72.9MB
```

## 2. Tagging images
Once you have an image locally, you can change its tag using the `tag`:
```
docker tag SOURCE_IMAGE[:TAG] TARGET_IMAGE[:TAG]
```
You can pick an arbitrary image and change its name and tag:
```
docker tag ubuntu:20.04 my-ubuntu:v1
```

> Remember that, always, you can use the image id instead of its name and tag.

If you list images again:
```
docker image ls
```
You can see two images with different name and tag but pointing to a single image (they have the same id):
```
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
my-ubuntu           v1                  d70eaf7277ea        7 days ago          72.9MB
ubuntu              20.04               d70eaf7277ea        7 days ago          72.9MB
```

## 3. Image repository
An image repository, like a code repository, is used for version controlling of docker images for a single software project or application. It stores docker images instead of code as opposed to the code repository.
Examples of some image repositories are: `containous/whoami` or `docker.elastic.co/kibana/kibana`. 
> Note when we are using image name we mean its repository name.

Repositories are stored in a docker registry. [Docker Hub](hub.docker.com) is the official docker registry that is hosted by docker itself.

To use images on your host, first, you need to pull them on your machine:
```
docker pull containous/whoami:v1.5.0
```
If you omit the tag, docker uses the `latest` tag. It means that the following commands are equal:
```
docker pull containous/whoami
```
and
```
docker pull containous/whoami:latest
```

Docker CLI by default pulls images from the docker hub. To pull an image from another image registry you have to prepend the registry address to the image name and tag:
> The command below is just an example and will fail because the `myregistry.io` does not exists in the real world!
```
docker pull myregistry.io/containous/whoami:v1.5.0
``` 
On the docker hub, there are official images for well-known images such as `mysql`, `ubuntu`, `jdk`, etc.
These official images usually do not need any prefixes so can simply use them like this:
```
docker image pull openjdk
```
For example, if you visit the [page](https://hub.docker.com/_/ubuntu) of the ubuntu image on the docker hub, you can see that it is labeled as an official docker image.

You can create an account for yourself on the [docker hub](https://hub.docker.com) so you can have public repositories for yourself.
For example, I have my version of the ubuntu image on my repository on the docker hub, which I can pull like this:
```
docker pull amirseyhani/ubuntu:latest
```
## 3. Building your first image
There are different ways to build a docker image. One way is to create the image from containers. To do so, first, we will bring up a base container we need (e.g. `ubuntu`). Next, we make any changes needed in the container. Now that we made the container ready, we can create an image from this modified container. It is like that we are freezing the container and then taking a snapshot of it. Let's try this method.
Assume that we want to create a custom image that contains a `greeting.txt` file in its home directory.
First, we bring up an ubuntu container:
```
docker run --name ubuntu-container -it ubuntu bash
```
Next, we create the file and put some message inside:
```
cd /home
touch greeting.txt
echo "Hello" > greeting.txt
```
Now, let's see the changes we have made to the container:
```
docker diff ubuntu-container
```
It looks like that docker is tracking the changes in the container like how git tracks the code changes. Like git, there is also a `commit` command with the following syntax:
```
docker commit [OPTIONS] CONTAINER [REPOSITORY[:TAG]]
```
Using the `commit` command, the changes we have made to a container are committed and results in a new image being created.
Let's commit the container with a proper name and tag:
```
docker commit ubuntu-container ubuntu-with-greeting:v1
```
Now, if we remove the container:
```
docker rm -f ubuntu-container
```
```
docker run --name ubuntu-container -it --rm ubuntu-with-greeting:v1 bash
```
You can verify that the greeting file exists in the container:
```
cat /home/greeting.txt
```
Finally, use the `exit` command to quit the container. 
```
exit
```
When we quit the container's shell, docker engine stops the container (we will discuss this behavior in the next steps). Now, because we have used the `--rm` option when we have started the container, docker engine removes the container whenever it stops.

## 4. Pushing the images
Now that you have a custom image you can push it to a repository to use it later. For pushing an image, first, you need to tag it properly. 

For pushing the `ubuntu-with-greeting` image to a repository on the docker hub you have to first tag the image like this:
```
docker tag ubuntu-with-greeting:v1 amirseyhani/ubuntu-with-greeting:v1
```

> Note that you could use the complete tag when you executed the commit command. So, you did not needed to tag it again.

>  The new tag name you are using here can be completely different.

Here the `amirseyhani/` prefix is mandatory which means that you push to a repository on a namespace of your account, which you have access to it.

> If you try to push the image with tag `ubuntu-with-greeting`, it means that you are trying to push your image on the root repository of the docker hub, which you do not have access to!

Next, before pushing the image, you have to log in to the docker hub:
```
docker login -u amirseyhani -p${password}
```
> After you have logged in, your credentials are stored on the host machine, so you do not need to log in again while your credentials are not expired.

Finally, you can push the image:
```
docker push amirseyhani/ubuntu-with-greeting:v1
```