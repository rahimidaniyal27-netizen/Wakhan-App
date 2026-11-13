const Module=require('node:module');
const moduleCopy=new Module('wakhan-acorn-local');
moduleCopy._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'wakhan-acorn-local');
const acorn=moduleCopy.exports;
function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const [key,value]of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(x=>walk(x,fn));else if(value&&typeof value==='object')walk(value,fn)}}
function find(source,name,type='assignment'){const matches=[];walk(acorn.parse(source,{ecmaVersion:'latest'}),node=>{if(type==='declaration'&&node.type==='FunctionDeclaration'&&node.id?.name===name)matches.push(node);if(type==='assignment'&&node.type==='AssignmentExpression'&&node.left?.type==='Identifier'&&node.left.name===name&&['FunctionExpression','ArrowFunctionExpression'].includes(node.right?.type))matches.push(node.right)});if(matches.length!==1)throw Error('Unexpected function count '+name+': '+matches.length);return matches[0]}
function replace(source,name,value,type){const n=find(source,name,type);return source.slice(0,n.start)+value+source.slice(n.end)}
module.exports={find,replace,walk};
