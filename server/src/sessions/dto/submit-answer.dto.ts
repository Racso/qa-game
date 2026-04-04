import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsInt()
  @Min(0)
  @Max(3)
  optionIndex!: number;
}
