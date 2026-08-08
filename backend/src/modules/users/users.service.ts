import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<Partial<User>> {
    const user = await this.findById(id);
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase() } });
      if (existing) throw new ConflictException('Email is already in use');
      user.email = dto.email.toLowerCase();
      user.isEmailVerified = false;
    }
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  async updateSettings(id: string, dto: UpdateSettingsDto): Promise<Partial<User>> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  async updateProfilePicture(id: string, url: string): Promise<Partial<User>> {
    const user = await this.findById(id);
    user.profilePictureUrl = url;
    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const user = await this.findById(id);
    user.isActive = false;
    await this.usersRepository.save(user);
    return { message: 'Account deactivated' };
  }

  private sanitize(user: User): Partial<User> {
    const { passwordHash, passwordResetToken, emailVerificationToken, ...rest } = user;
    void passwordHash; void passwordResetToken; void emailVerificationToken;
    return rest;
  }
}
