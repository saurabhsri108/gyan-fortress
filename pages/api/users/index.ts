import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser, getUsers } from '@lib/prisma/user';
import bcrypt from 'bcrypt';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'GET') {
        try {
            const { users, error } = await getUsers();
            if (error) throw new Error(error);
            return res.status(200).json({ users });
        } catch (error: any) {
            return res.status(500).json({
                error: {
                    code: error?.code,
                    meta: error?.meta,
                    message: error?.message,
                    clientVersion: error?.clientVersion,
                    stack: error?.stack
                }
            });
        }
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;
            const hashPassword = await bcrypt.hash(data.password, 10);
            const userData = { ...data, password: hashPassword };
            const { user, error } = await createUser(userData);
            if (error) throw new Error(error);
            return res.status(201).json({ user });
        } catch (error: any) {
            return res.status(500).json({
                error: {
                    code: error?.code,
                    meta: error?.meta,
                    message: error?.message,
                    clientVersion: error?.clientVersion,
                    stack: error?.stack
                }
            });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(425).end(`Method ${req.method} is not allowed`);
};

export default handler;