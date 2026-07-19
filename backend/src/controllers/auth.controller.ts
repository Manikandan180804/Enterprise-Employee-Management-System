import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const generateTokens = (userId: string, employeeId: string, role: string, email: string) => {
  const payload = { userId, employeeId, role, email };
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
};

export const login = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : email;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.employee.isDeleted || user.employee.status === 'INACTIVE') {
      throw new AppError('Account is deactivated. Contact your administrator.', 403);
    }

    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.employeeId,
      user.employee.role,
      user.email
    );

    // Store refresh token hash
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(refreshToken, 10),
        lastLoginAt: new Date(),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          employeeId: user.employee.id,
          email: user.email,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          role: user.employee.role,
          profileImageUrl: user.employee.profileImageUrl,
          department: user.employee.department?.name,
          designation: user.employee.designation,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) throw new AppError('Refresh token required', 401);

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: true },
    });

    if (!user || !user.refreshToken) throw new AppError('Session expired', 401);

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) throw new AppError('Invalid refresh token', 401);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.employeeId,
      user.employee.role,
      user.email
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(newRefreshToken, 10) },
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { refreshToken: null },
      });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.user!.employeeId },
      include: { department: true, manager: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!employee) throw new AppError('Employee not found', 404);

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};
