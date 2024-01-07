import { sign } from "jsonwebtoken";
import dayjs from "dayjs";

export const getNewToken = (data: Record<string, any>) => {
  const today = dayjs();

  return sign(data, "app-secret-key", {
    expiresIn: today
      .set("hour", 23)
      .set("minute", 59)
      .set("second", 59)
      .diff(today, "seconds"),
  });
};
