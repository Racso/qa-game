import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Max, Min, ValidateNested } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctIndex!: number;

  @IsInt()
  @Min(5)
  @Max(120)
  timeLimitSeconds!: number;
}

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];
}
