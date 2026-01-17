import Joi from 'joi';

const playerInputSchema = Joi.object({
  direction: Joi.string().valid('up', 'down', 'left', 'right').required(),
  timestamp: Joi.number().optional()
});

export function validatePlayerInput(input: any) {
  const { error, value } = playerInputSchema.validate(input);
  
  if (error) {
    throw new Error(`Invalid input: ${error.message}`);
  }
  
  return value;
}

const walletSchema = Joi.object({
  address: Joi.string().length(34).required(),
  signature: Joi.string().optional()
});

export function validateWallet(wallet: any) {
  const { error, value } = walletSchema.validate(wallet);
  
  if (error) {
    throw new Error(`Invalid wallet: ${error.message}`);
  }
  
  return value;
}
