import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class JoinSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name!: string;
}
