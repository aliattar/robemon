export const stack = [];

export const scenes = {
  push(s) { stack.push(s); },
  pop() { stack.pop(); },
  replace(s) { stack.length = 0; stack.push(s); },
  swap(s) { stack[stack.length - 1] = s; },
  top() { return stack[stack.length - 1]; },
};
