
export function ok(): any {
  return Response.json({ ok: true });
}

export function json(data: Record<string, any> = {}): any {
  return Response.json(data);
}

export function badRequest(error?: Record<string, any>): any {
  return Response.json(
    {
      error: { message: 'Bad request', code: 'bad-request', status: 400, ...error },
    },
    { status: 400 },
  );
}

export function unauthorized(error?: Record<string, any>): any {
  return Response.json(
    {
      error: {
        message: 'Unauthorized',
        code: 'unauthorized',
        status: 401,
        ...error,
      },
    },
    { status: 401 },
  );
}

export function paymentRequired(error?: Record<string, any>): any {
  return Response.json(
    {
      error: {
        message: 'Payment required: Subscription locked or unpaid',
        code: 'payment-required',
        status: 402,
        ...error,
      },
    },
    { status: 402 },
  );
}

export function forbidden(error?: Record<string, any>): any {
  return Response.json(
    { error: { message: 'Forbidden', code: 'forbidden', status: 403, ...error } },
    { status: 403 },
  );
}

export function notFound(error?: Record<string, any>): any {
  return Response.json(
    { error: { message: 'Not found', code: 'not-found', status: 404, ...error } },
    { status: 404 },
  );
}

export function serverError(error?: Record<string, any>): any {
  return Response.json(
    {
      error: {
        message: 'Server error',
        code: 'server-error',
        status: 500,
        ...error,
      },
    },
    { status: 500 },
  );
}

export function error(err: any): any { return serverError(err); }
