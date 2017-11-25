var path=Editor.projectPath+'/packages/outline/';
var udpLog=require('./udplog');
udpLog.resetDst('127.0.0.1',20131,1);

//加载主模板的构造模块
var fileBuilder=require('./template/cpp/templete.js');
//加载结构体的定义的构造模块
var structBuilder=require('./template/cpp/templete_struct');
//加载根节点的定义的构造模块
var rootBuilder=require('./template/cpp/templete_rootDeclare');
//加载所有子节点的定义的构造模块
var instanceBuilder=require('./template/cpp/templete_initInstance');
//加载处理所有子节点outliene关系的构造模块
var relationBuilder=require('./template/cpp/templete_initOutlineRelation');
//加载筛选节点到相应层级的模块
var sort=require('./sort');

var fs=require('fs');
function writeFile(str){
  fs.writeFileSync(path+'test.hpp',str);
}

function getPName(obj){
  var name=obj.name;
  while(obj.parent){
    name=obj.parent.name+'_'+name;
    obj=obj.parent;
  }
  return name;
}

function buildContent(data){
  var canvas_outline=JSON.parse(data);
  var sorted=sort.sort(canvas_outline);
  var bottomUped=sort.bottomUp(sorted);
  //主模板
  var text=fileBuilder.getContentTemplate();

  //构造结构体的定义
  var defArr=[];
  for(var i=0;i<bottomUped.length;i++){
    var objs=bottomUped[i];
    for(var j=0;j<objs.length;j++){
      var obj=objs[j];
      var def={};
      def.name=obj.name;
      def.PName=getPName(obj);
      var childrenName=[];
      var children=obj.children;
      if(children)
          for(var k=0;k<children.length;k++){
              childrenName.push({name:children[k].name,PName:getPName(children[k])});
          }
      def.children=childrenName;
      defArr.push(def);
    }
  }
  var text_struct=structBuilder.getStructDefinition(defArr);
  text=fileBuilder.insertStructDefinition(text,text_struct);

  //根节点的定义
  var para={name:canvas_outline.name};
  var attrNames=['x','y','width','height','anchorX','anchorY','scale','rotation','opacity','visible','zOrder','key','value'];
  function isAttrName(attrName){
    for(var i=0;i<attrNames.length;i++)
        if(attrNames[i]===attrName)
            return true;
    return false;
  }          
  var attrs=[];
  for(var attrName in canvas_outline){
    if(isAttrName(attrName))
        attrs.push({
          name:attrName,
          value:canvas_outline[attrName],
          nodeName:canvas_outline.name,
        });
  }
  para.attrs=attrs;
  var text_rootDeclare=rootBuilder.getRootDeclare(para);
  text=fileBuilder.insertRootDeclare(text,text_rootDeclare);

  //所有子节点的定义
  var paras=[];
  for(var i=1;i<sorted.length;i++){
    for(var j=0;j<sorted[i].length;j++){
      var obj=sorted[i][j];
      var para={name:obj.name,parent:getPName(obj.parent),PName:getPName(obj)};       
      var attrs=[];
      for(var attrName in obj){
        if(isAttrName(attrName))
            attrs.push({
              name:attrName,
              value:obj[attrName],
              PnodeName:getPName(obj),
            });
      }
      para.attrs=attrs;
      paras.push(para);
    }
  }
  var text_initInstance=instanceBuilder.getInstanceInit(paras);
  text=fileBuilder.insertInstanceInit(text,text_initInstance);

  //所有节点的父子关系
  var relations=[];
  for(var i=1;i<bottomUped.length;i++){
    for (var j=0;j<bottomUped[i].length;j++){
      var obj=bottomUped[i][j];
      var relation={name:getPName(obj)};
      var childrenName=[];
      var children=obj.children;
      for(var k=0;k<children.length;k++){
        childrenName.push(getPName(children[k]));
      }
      relation.children=childrenName;
      relations.push(relation);
    }
  }
  var text_initRelation=relationBuilder.getRelation(relations);
  text=fileBuilder.insertRelation(text,text_initRelation);
  
  return text;
}

module.exports = {
  load () {
    // 当 package 被正确加载的时候执行
  },

  unload () {
    // 当 package 被正确卸载的时候执行
  },
  messages: {
    'export-node' () {
      Editor.Panel.open('outline');
      Editor.Scene.callSceneScript('outline', 'getExportRules', function (data) {
        var exportRules=JSON.parse(data);
        Editor.Scene.callSceneScript('outline', 'getNode',exportRules[0],function (data) {
          udpLog.si(data);
        });
      });
    }
  },
};