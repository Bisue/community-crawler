import { config } from 'dotenv';
config();

const everytime = {
  id: process.env.EVERYTIME_ID ?? 'NONE',
  pw: process.env.EVERYTIME_PW ?? 'NONE',
};

export default {
  everytime,
};
