export class M3Error extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'M3Error';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const normalizeM3Error = (error) => {
  if (error instanceof M3Error) {
    return error;
  }

  if (error?.name === 'ValidationError') {
    return new M3Error(
      400,
      'VALIDATION_ERROR',
      'The submitted data is invalid',
      Object.values(error.errors ?? {}).map((item) => item.message)
    );
  }

  if (error?.name === 'CastError') {
    return new M3Error(400, 'INVALID_ID', 'The supplied resource id is invalid');
  }

  if (error?.code === 11000) {
    return new M3Error(409, 'DUPLICATE_RESOURCE', 'The resource already exists');
  }

  return new M3Error(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
};

export const sendM3Error = (res, error) => {
  const normalized = normalizeM3Error(error);

  return res.status(normalized.status).json({
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {})
    }
  });
};
