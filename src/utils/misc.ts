import * as bcrypt from 'bcrypt';
import { PUBLIC_DIR } from './constants';
import { join } from 'path';
import * as fs from 'fs';
import { EOL } from 'os';

export const hashPassword = async (
  password: string,
  saltRounds = 10,
): Promise<string> => {
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (hash: string, password: string) => {
  return await await bcrypt.compare(password, hash);
};

export const generateOtpCode = (length = 4) => {
  let randomNumber = Math.floor(Math.random() * 10);

  let randomDigits = '';
  for (let i = 0; i < length; i++) {
    randomDigits += randomNumber;
    randomNumber = Math.floor(Math.random() * 10);
  }

  return +randomDigits;
};

export const checkOtpExpired = (createdDate: Date, minutes = 5) => {
  const now = new Date();

  let differenceValue = (now.getTime() - createdDate.getTime()) / 1000;
  differenceValue /= 60;

  return Math.abs(Math.round(differenceValue)) > minutes;
};

export const generateAPIToken = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

export const createDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const writeFile = (filePath, content, append = false) => {
  if (append) {
    fs.appendFileSync(filePath, JSON.stringify(content) + EOL, {
      encoding: 'utf-8',
    });
  } else {
    fs.writeFileSync(`${filePath}`, content, {
      encoding: 'utf-8',
    });
  }
};

export const generateShopifyOutputFilePath = (
  fileName: string,
  type = 'images',
) => {
  return join(PUBLIC_DIR, type, fileName);
};

export const generateFilePath = (
  filename: string,
  folder: string,
  companyId: string,
) => {
  const dirPath = join(PUBLIC_DIR, String(companyId), folder);
  const filePath = join(dirPath, filename);

  createDir(dirPath);

  return filePath;
};

export const deleteFile = (filePath: string) => {
  fs.unlinkSync(filePath);
};

export const generateAppIconUrl = (path: string) => {
  if (!path) {
    return null;
  }

  const url: any = path.replace(/\\/g, '/').split('/');

  url.shift();
  const result = `${process.env.BASE_URL}/${url.join('/')}`;
  return result;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const formatQueryParams = (queryParams: any, filterFields = []) => {
  let page = 1;

  const filters: Record<string, any> = {};
  const pagination: { skip: number; limit: number } = {
    skip: 0,
    limit: 50,
  };

  filterFields.forEach((field) => {
    if (queryParams?.[field]) {
      if (field === 'interest') {
        filters[field] = { contains: queryParams[field] };
      } else if (field === 'startDate') {
        filters['createdAt'] = { gte: new Date(queryParams[field]) };
      } else if (field === 'endDate') {
        if (filters['createdAt']) {
          filters['createdAt'].lte = new Date(queryParams[field]);
        } else {
          filters['createdAt'] = { lte: new Date(queryParams[field]) };
        }
      } else {
        filters[field] = queryParams[field];
      }
    }
  });

  if (queryParams?.page) {
    page = Number(queryParams.page);
  }

  if (queryParams?.limit) {
    pagination.limit = Number(queryParams.limit);
  }

  pagination.skip = (page - 1) * pagination.limit;

  return { pagination, filters };
};
