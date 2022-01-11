import validator from 'validator';

export const formatTag = (tag: string): string => {
  return tag
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter((s) => s !== '')
    .join(' ');
}

// generic url validator
export const isUrl = (input: string): boolean => {
  if (input === '') {
    return true;
  }
  return validator.isURL(input.trim());
};

// validation for ip, ip with a port, or just a port
export const isIp = (input: string): boolean => {
  if (input === '') {
    return true;
  }
  const trimmedInput = input.trim();
  if (trimmedInput[0] === ':') {
    return validator.isPort(trimmedInput.substr(1));
  }
  if (validator.isIP(trimmedInput)) {
    return true;
  }
  const lastColon = trimmedInput.lastIndexOf(':');
  const validIP = validator.isIP(trimmedInput.substr(0, lastColon));
  const validPort = validator.isPort(trimmedInput.substr(lastColon + 1));
  return validIP && validPort;
};
