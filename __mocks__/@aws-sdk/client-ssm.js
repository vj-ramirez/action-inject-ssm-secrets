export const mockSend = jest.fn().mockResolvedValue({
  Parameter: {
    Value: 'super-secret-value',
  },
});

export const SSMClient = jest.fn().mockImplementation(() => ({
  send: mockSend,
}));

export const GetParameterCommand = jest.fn().mockImplementation((params) => params);