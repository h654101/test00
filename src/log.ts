import dayjs from "dayjs";
import { createClient } from "redis";

const client = createClient({
  password: "F2XAtLSXGjVts5BxQtbqGFYvvX4wH3SI",
  socket: {
    host: "redis-16369.c323.us-east-1-2.ec2.cloud.redislabs.com",
    port: 16369,
  },
});
client.on("error", (err) => console.log(err)).connect();

export const write = (txt: string) => {
  const day = dayjs().format("YYYY:MM:DD");
  const time = dayjs().format("H:mm:ss");

  const line = `${time} ${txt}`;

  client.lPush(day, line);
};
