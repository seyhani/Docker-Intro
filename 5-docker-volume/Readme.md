# Docker Volumes

## 1. What we need volumes?
Suppose that we have a MySQL server container for storing the data for a web application. 
Let's start a MySQL server container:
```
docker run --name mysql-container -e MYSQL_ROOT_PASSWORD=1234 -d  mysql
```
> In the above command, we used `-e` option to pass the `MYSQL_ROOT_PASSWORD` environment variable to the container. Most images usually use environment variables for common and important configuration options. A list of such environment variables and configuration options can be found on the official page of the image. 

Then, we make shell access to the container:
```
docker exec -it mysql-container bash
```
Now, let's log in to the MySQL server using the `mysql` shell:
```
mysql -uroot -p1234
```
> Please note that you have to wait a little before executing the above command so MySQL server completes its initialization. You can check the container logs and when you see a line like this: `Plugin ready for connections. Socket: '/var/run/mysqld/mysqlx.sock' bind-address: '::' port: 33060
` you can be sure that the MySQL server is ready.

And then create an user and a database:
```sql
CREATE DATABASE Test;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'pass';
GRANT ALL PRIVILEGES ON * . * TO 'admin'@'localhost';
exit
```
Now, if we close the container's shell, we can login again using using admin user's credentials:
```
exit
mysql -uadmin -ppass
```
You can also check that the `Test` database exists:
```sql
SHOW DATABASES;
```
Now, if we stop the container and start it again, you can verify that the database has remained intact. But, what happens if we remove the container?
```
docker rm -f mysql-container
```
Then you can check that if you create a MySQL container again, all data we have added, has been lost (the `admin` user and the `Test` database). This is the case where using volumes is needed. Volumes are a kind of storage that can be shared among containers. When we attach a volume to a container, after removing the container, the volume remains intact. So we can start another container and attach the volume to the new container.
> The concept of volumes makes a separation of the application and data. With this separation, you can have a stateless application. With stateless applications, we can achieve simpler scaling, deployment, updating, etc.

Let's see how we can use a volume for storing the actual data of our database.
The most basic type of volume is `bind-mount`. When `bind-mount` volumes, actually we are making a volume from a file or directory on the host machine. We can then attach this volume to containers on a specific path. In other words, we are binding these two directories or files with each other.

Most images, like MySQL, store their data in a specific directory or file. The MySQL image stores its data in the `/var/lib/mysql` directory. So we try to mount a directory on the host machine into the `/var/lib/mysql` path of the container. By doing so, we are storing the actual data of the database on the host machine and the container only plays the role of an stateless application. We can remove the container or move it, without any change on the actual data.

Let's start by creating a directory with an arbitrary name on the host:
```
mkdir mysql-data
```
Next, when we want to create a MySQL container, we create a volume using `mysql-data` directory and mount it into the container at `/var/lib/mysql/` :
```
docker run --name mysql-container -e MYSQL_ROOT_PASSWORD=1234 -v $(pwd)/mysql-data:/var/lib/mysql -d  mysql
```
In the above command, we have used the `-v` option to bind `mysql-data` on the host into the container at `/var/lib/mysql`.
> Note that when using `bind-mount` volumes in the `run` command, it is required to use absolute paths for both source and destination. 

Now, let's exec into the container and executing previous commands again:
```
docker exec -it mysql-container bash
```

```
mysql -uroot -p1234
```
> Again, remember to wait for database initialization.

```sql
CREATE DATABASE Test;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'pass';
GRANT ALL PRIVILEGES ON * . * TO 'admin'@'localhost';
exit
```
Okay, let's remove the container again!
```
docker rm -f mysql-container
```
You can see that the `mysql-data` directory and its content has remained intact on the host.

To verify this, create a new mysql container with this volume:
```
docker run --name mysql-container -v $(pwd)/mysql-data:/var/lib/mysql -d mysql
```
> We didn't specify the `MYSQL_ROOT_PASSWORD` variable in the above command. This value is used during the database initialization, since we already have the data, the root user is already created and initialization won't take place again. 
Even if we specify this environment variable, it won't be used.


Now, you can exec into the container:
```
docker exec -it mysql-container bash
```
And then you can verify that the admin user and Test database is existing:
```
mysql -uadmin -ppass
```
```sql
SHOW DATABASES
```
Remove the MySQL container when you are done:
```
docker rm -f mysql-container
```

## 2. Share the data with volumes
Alongside data persistence, volumes can be used to share data among containers and also the host machine.

This time we create an Nginx container again, but instead of putting our HTML inside the image, we use volumes to share the HTML files with the Nginx container:
```
docker run -d --name nginx-container -p 8080:80 -v $(pwd)/nginx-data:/usr/share/nginx/html/ nginx
```

If you access the `localhost:8080`, you can see the `index.html` page content as we did in the previous step. 
```
curl localhost:8080
```
The key point of using the volume here is that both the host and the container are using the files reside in `nginx-data`. So let's edit the `index.html` file and see what happens:
```html
<html>
<body>
    <h1>
        Hello! I have updated this message!
    </h1>
</body>
</html>
```
And then you can see the new message:
```
curl localhost:8080
```
Remove the container when you are done:
```
docker rm -f nginx-container
```


