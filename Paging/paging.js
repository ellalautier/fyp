var mainMemorySize = 1024;
var numFrames=1;
var pageSize=mainMemorySize;


var mainMemoryArray = ["FREE"];
var instructionArray=[[]];
var backingStoreArray;

var algorithm;
var algorithmArray=[];

var pageTableArray=[];


var exitPoints=[];

$(document).ready(function() {
      
     // $("#runNextInstruction").hide();
 
 
      drawMainMemory();
      //drawInstructions();
   
});

function save(){
  
  if(instructionArray[0].length<1){
    alert("Error: No instructions");
    return;
  }
  
  var dataToSave=document.getElementById("toSave");
  var data={
    inst:instructionArray,
    back:backingStoreArray
  };
  
  
  
  var file="text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
  console.log(file);
  dataToSave.setAttribute("href", "data:"+file);  
  dataToSave.setAttribute("download", "memMgmt.json");
  dataToSave.click();

}


function load(){
  var input=document.getElementById("loadedFile");
  var fileContents, fileText;
  
  if(!window.FileReader){
    alert("Not supported by browser");
  }else{
    if(!input.files.length){
      alert("Error: No file found");
      return;
    }
    var file=input.files[0];
    var fr=new FileReader();
    fr.readAsText(file, "UTF-8");
    fr.onload=function(evt){
      fileContents=evt.target.result;
      //console.log(fileContents);
      fileText=JSON.parse(fileContents);
      backingStoreArray=fileText.back;
      instructionArray=fileText.inst;
      //segmentTableArray=fileText.seg;
      resetAll();
      drawBackingStore();
    }
  }
}

function loadExample(){
  instructionArray=[["B",300],["A",10],["B",100],["B",400],["B",550],["B",20],["B",105],["B",600],["B",275],["A",175],["B",570],["A",770],["B",380],["A",0],["B",300],["A",150],["B",580],["B",5],["A",175]];
  backingStoreArray=[["A",800],["B",600]];
  findExit(instructionArray);
  resetSim();
}

function resetAll(){
  counter=0;
  prevBlock=null;
  algorithmArray=[];
  generatePageTables();
  generateMainMemory(numFrames);
  drawInstructions();
  drawMainMemory();
  drawPageTables();

}

function resetSim(){
  
  if(backingStoreArray!=undefined){
    //finding num of page
    for(var i=0; i<backingStoreArray.length;i++){
      backingStoreArray[i][2]=findNumPages(backingStoreArray[i][1]);
    }
    drawBackingStore();
  }
  resetAll();
  if(instructionArray[0][0]==undefined){
      $("#instructions").empty();   
  }

}


function saveSetup(){
  var frameError=false;
  var frameSize=Number($('#sizeFrames').val());
  //console.log(frameSize);
  //correct size
  if(frameSize>=mainMemorySize || frameSize<=1){
    frameError=true;
    alert("Error: Invalid frame size");
  }
 
  //size power of 2
  if(frameError==false){
    var temp=Math.log2(frameSize);
    //console.log(temp);
    if(Number.isInteger(temp)){
      
      numFrames=mainMemorySize/frameSize;
      pageSize=frameSize;
      resetSim();
      alert("Success");
      
      
    }else{
      frameError=true;
      alert("Error: frame size is not a power of 2");
    }
  }
  
  algorithm=$("#swappingAlgorithm").val();
  $("#nextInstrButton").show();
  
}



var counter=0;
var prevBlock;
function runInstr(){
  //console.log(mainMemoryArray[prevBlock]);
  if(instructionArray[0].length==0){
    alert("No instructions");
  }else if(counter==instructionArray.length){      
    alert("Instructions executed successfully");
    resetAll();
    
  }else{
    if(counter>0){
      $("#instructionRow"+(counter-1)).removeClass("selectedInstr");
      $("#memoryRow"+prevBlock).removeClass("selectedMemory");
      $("#pageRow"+mainMemoryArray[prevBlock]).removeClass("selectedPage");
    }
    $("#instructionRow"+counter).addClass("selectedInstr");

    
    if(counter==0){
      findExit(instructionArray);
    }
    
    //check for process exits
    for(var y=0;y<exitPoints.length;y++){
      if(counter==exitPoints[y][1]){
        removeProcessFromMem(exitPoints[y][0]);
        drawMainMemory();
        drawPageTables();
      }
    }
    
    
    
    
    
    var success=false;
    //finding process and page num
    var proc=findPageTable(instructionArray[counter][0]);
    var instrPage=findPageNum(instructionArray[counter][1]);
    if(pageTableArray[proc].length>(instrPage+1)){
      success=true;
      //load page if not already loaded
      if(pageTableArray[proc][instrPage+1]=="Backing Store"){
        loadPageToMem(instructionArray[counter][0], instrPage);
        drawMainMemory();
      }
      
      var frameNum=pageTableArray[proc][instrPage+1];
      $("#memoryRow"+frameNum).addClass("selectedMemory");
      $("#pageRow"+mainMemoryArray[frameNum]).addClass("selectedPage");
      $("#pageTables").prepend("<p style='text-align: center; padding-top:10px; padding-right:30px;' > " + instructionArray[counter][1]+" / "+pageSize+ " &asymp; page " + instrPage+ "</p>");
      //console.log(mainMemoryArray[frameNum]);
      prevBlock=frameNum;
      if(algorithm=="Least Frequently Used"){
        for(var j=0; j<algorithmArray.length; j++){
          if(algorithmArray[j][0]==instructionArray[counter][0] && algorithmArray[j][1]==instrPage){
            algorithmArray[j][2]++;
            break;
          } 
        }
      }else if(algorithm=="Least Recently Used"){
        for(var j=0; j<algorithmArray.length; j++){
          if(algorithmArray[j][0]==instructionArray[counter][0] && algorithmArray[j][1]==instrPage){
            algorithmArray[j][2]=counter;
            break;
          } 
        }
      }
    }
    counter++;
  }
  
  if(success==false){
    alert("Error: this address does not belong to this segment");
    $("#instructionRow"+(counter-1)).removeClass("selectedInstr");
    $("#memoryRow"+prevBlock).removeClass("selectedMemory");
    $("#segmentRow"+mainMemoryArray[prevBlock]).removeClass("selectedSegment");
    counter=0;   
  }
}



//BACKING STORE
function drawBackingStore(){
  $("#backingStore").empty();
  var backingStorePanel=document.createElement("div");
  backingStorePanel.className="memoryPanel";
  
  //headers
  var header = document.createElement("div");
  header.className = "header";
  header.appendChild(document.createTextNode("Backing Store"));
  backingStorePanel.appendChild(header);
  
  //table
  var table=document.createElement("table");
  table.className="table";
  
  //headers
  var thead=document.createElement("thead");
  var tr=document.createElement("tr");
  
  var procID = document.createElement("th");
  procID.appendChild(document.createTextNode("Process ID"));
  tr.appendChild(procID);
  var procSize = document.createElement("th");
  procSize.appendChild(document.createTextNode("Size"));
  tr.appendChild(procSize);
  var numPages = document.createElement("th");
  numPages.appendChild(document.createTextNode("Number of Pages"));
  tr.appendChild(numPages);
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  //table contents
  for(var j=0; j<backingStoreArray.length; j++){
    var row=document.createElement("tr");
    row.setAttribute("id", "backingStoreRow"+j);
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(backingStoreArray[j][0]));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(backingStoreArray[j][1]));
    var elem2=document.createElement("td");
    elem2.appendChild(document.createTextNode(backingStoreArray[j][2]));
    row.appendChild(elem0);
    row.appendChild(elem1);
    row.appendChild(elem2);
    table.appendChild(row);
  }
  backingStorePanel.appendChild(table);
  document.getElementById("backingStore").appendChild(backingStorePanel);
  
}

//SEGMENT TABLE
function drawSegmentTable(){
  $("#segmentTable").empty();
  var segmentTablePanel=document.createElement("div");
  segmentTablePanel.className="segmentTablePanel";
  
  //table
  var table=document.createElement("table");
  table.className="table";
  
  var thead=document.createElement("thead");
  var tr=document.createElement("tr");
  
  var segNumT = document.createElement("th");
  segNumT.appendChild(document.createTextNode("Segment Number"));
  tr.appendChild(segNumT);
  var baseColumn = document.createElement("th");
  baseColumn.appendChild(document.createTextNode("Base"));
  tr.appendChild(baseColumn);
  var limitColumn = document.createElement("th");
  limitColumn.appendChild(document.createTextNode("Limit"));
  tr.appendChild(limitColumn);
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  for(var j=0; j<segmentTableArray.length; j++){
    var row=document.createElement("tr");
    row.setAttribute("id", "segmentRow"+j);
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(j));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(segmentTableArray[j][0]));
    var elem2=document.createElement("td");
    elem2.appendChild(document.createTextNode(segmentTableArray[j][1]));
    row.appendChild(elem0);
    row.appendChild(elem1);
    row.appendChild(elem2);
    table.appendChild(row);
  }
  
  
  
  segmentTablePanel.appendChild(table);
  document.getElementById("segmentTable").appendChild(segmentTablePanel);
}


//INSTRUCTION FUNCTIONS
function drawInstructions(){
  $("#instructions").empty();
  var instructionsPanel = document.createElement("div");
  instructionsPanel.className = "instructionsPanel";
  
  //headers
  var header = document.createElement("div");
  header.className = "header";
  header.appendChild(document.createTextNode("Instructions"));
  instructionsPanel.appendChild(header);
  // Main memory table
  var table = document.createElement("table");
  table.className = "table";
  // Names of columns
  var thead = document.createElement("thead");
  var tr = document.createElement("tr");
  // PID column 
  var pidColumn = document.createElement("th");
  pidColumn.appendChild(document.createTextNode("PID"));
  tr.appendChild(pidColumn);
  // offset column 
  var addressColumn = document.createElement("th");
  addressColumn.appendChild(document.createTextNode("Address"));
  tr.appendChild(addressColumn);
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  
  for(i=0; i<instructionArray.length; i++){
    var row=document.createElement("tr");
    row.setAttribute("id", "instructionRow"+i);
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(instructionArray[i][0]));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(instructionArray[i][1]));
    
   
    row.appendChild(elem0);
    row.appendChild(elem1);
    table.appendChild(row);
  }
  
        
  instructionsPanel.appendChild(table);
  document.getElementById("instructions").appendChild(instructionsPanel);
  
}

var numInstructions=1;
function addInstruction(){
  
  document.getElementById('instr'+numInstructions).innerHTML=
  "<td> <input type='text' id='pid"+numInstructions+"' placeholder='PID' class='form-control'/></td> <td><input type='number' id='offsetIn"+numInstructions+"' placeholder='Offset' class='form-control'/></td>";
  numInstructions++;
  $("#instructionsTable").find("tbody").append($("<tr id='instr"+(numInstructions)+ "'></tr>"));

}

function removeInstruction(){
  if(numInstructions>1){
    $('#instr'+(numInstructions)).remove();
    $('#instr'+(numInstructions-1)).empty();
    numInstructions--;
  } 
}

function saveInstructions(){
   var instError=false;
   instructionArray=[[]];
   
  //check that all fields are filled in 
  $('#instructionsTable tr').each(function(){
    $(this).find('td input').each(function(){
        if(isEmpty($(this)) && instError==false){
          //console.log(this);
          alert("Fields left empty");
          instError=true;   
          return;         
        }
    })
  });
  
  var tempTable=[[]];
  if(instError==false){
    for(var i=0; i<numInstructions; i++){
      var pid=$("#pid"+i).val().toUpperCase();
      
     // console.log(i+" "+segNum);
      //var pageNumber=Number($("#page"+i).val());
      var instrOffset=Number($("#offsetIn"+i).val())
      tempTable[i]=[pid,instrOffset];
      
    }
  }
  
  //check that address is valid
  if(instError==false){
    for(var i=0; i<tempTable.length;i++){
    var currentOffset=tempTable[i][1];
      if(currentOffset>=mainMemorySize || currentOffset<0){
        alert("Error: Address not valid");
        instError=true;
        break;
      }
    }
   // $("#runNextInstruction").show();
  }	
  
  if(instError==false&&(!nameValid(tempTable))){
    instError=true;
    alert("Error: PID cannot be 'free'");
  }
  
  if(instError==false){
    for(var i=0;i<tempTable.length; i++){
      if(!pidExists(backingStoreArray, tempTable[i][0], tempTable[i][1])){
        instError=true;
        alert("Error: One or more of these processes or pages do not exist.");
        break;
      }
    }
  }
  
  
  
  if(instError==false){
   
    instructionArray=tempTable;
    resetAll();
    tempTable=[];
    drawInstructions();
    drawPageTables();
    
    
    //console.log(ln);
   //console.log(tempTable);
  }
  
}

//MAIN MEMORY FUNCTIONS
function drawMainMemory(){
  $("#mainMemory").empty();
  var mainMemoryPanel = document.createElement("div");
  mainMemoryPanel.className = "memoryPanel";
  
  //headers
  var header = document.createElement("div");
  header.className = "header";
  header.appendChild(document.createTextNode("Physical Memory"));
  mainMemoryPanel.appendChild(header);
  var memSizeHeader=document.createElement("div");
  memSizeHeader.className="header2";
  memSizeHeader.appendChild(document.createTextNode("Main Memory Size: "+mainMemorySize));
  mainMemoryPanel.appendChild(memSizeHeader);
  var frameSizeHeader=document.createElement("div");
  frameSizeHeader.className="header2";
  frameSizeHeader.appendChild(document.createTextNode("Frame Size: "+pageSize));
  mainMemoryPanel.appendChild(frameSizeHeader);
  // Main memory table
  var table = document.createElement("table");
  table.className = "table";

  // Names of columns
  var thead = document.createElement("thead");
  var tr = document.createElement("tr");
  //Frame number column 
  var frameColumn = document.createElement("th");
  frameColumn.appendChild(document.createTextNode("Frame Number"));
  tr.appendChild(frameColumn);
  // page column 
  var pageColumn = document.createElement("th");
  pageColumn.appendChild(document.createTextNode("Page"));
  tr.appendChild(pageColumn);
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  
  for(i=0; i<mainMemoryArray.length; i++){
    var row=document.createElement("tr");
    row.setAttribute("id", "memoryRow"+i);
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(i));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(mainMemoryArray[i]));
    
    row.appendChild(elem0);
    row.appendChild(elem1);
    table.appendChild(row);
  }
  
        
  mainMemoryPanel.appendChild(table);
  document.getElementById("mainMemory").appendChild(mainMemoryPanel);
  

}

var numProcesses=1;
function addProcess(){
  
  document.getElementById('process'+numProcesses).innerHTML=
  "<td> <input type='text' id='name"+numProcesses+"' placeholder='Process ID' style='text-transform:uppercase' class='form-control'/></td> <td><input type='number' id='size"+numProcesses+"' placeholder='Size' class='form-control' min='1'/></td>";
  //document.getElementById("process"+numProcesses).after(<tr id='process"+(numProcesses+1)+ "'></tr>);
  numProcesses++;
  $("#processMemoryTable").find("tbody").append($("<tr id='process"+(numProcesses)+ "'></tr>"));
}

function removeProcess(){
  if(numProcesses>1){
    
    $('#process'+(numProcesses)).remove();
    $('#process'+(numProcesses-1)).empty();
    numProcesses--;
  } 
 
}

function saveProcesses(){
   var procError=false;
   
  //check that all fields are filled in 
  $('#processMemoryTable tr').each(function(){
    $(this).find('td input').each(function(){
        if(isEmpty($(this)) && procError==false){
          //console.log(this);
          alert("Fields left empty");
          procError=true;   
          return;         
        }
    })
  });
  
  var tempTable=[[]];
  //saving inputs to temporary array
  if(procError==false){
    for(var i=0; i<numProcesses; i++){
      var procName=$("#name"+i).val().toUpperCase();
      var procSize=Number($("#size"+i).val());
      tempTable[i]=[procName, procSize];
    }
    //console.log(tempTable);
  }
  
  //check that address is valid
  if(procError==false){
    for(var i=0; i<tempTable.length;i++){
      if(!addressValid(tempTable[i][1])){
        alert("Address not valid");
        procError=true;
      }
    }
  }	
  
  //check name is valid
   if(procError==false&&(!nameValid(tempTable) || !noDuplicates(tempTable))){
    procError=true;
    alert("Error: PID cannot be 'free' or duplicated");
  }
  
  
  //saving
  if(procError==false){
    
    //finding num of pages
    var tempTable2=[];
    for(var i=0; i<tempTable.length;i++){
      tempTable2[i]=[tempTable[i][0], tempTable[i][1], findNumPages(tempTable[i][1])];
    }
    
    backingStoreArray=tempTable2;
    generatePageTables();
    
    drawMainMemory();
    drawBackingStore();
    drawPageTables();

  }
  
  //console.log($("#name0").val().length);
}


function noDuplicates(table){
  for(var i=0; i<table.length;i++){
    for(var j=i+1; j<table.length;j++){
      if(table[i][0]==table[j][0]){
        return false;
      }
    }
  }
  return true;
}

//checks for valid name
function nameValid(table){
  for(var i=0; i<table.length; i++){
    if(table[i][0]=="FREE"){
      return false;
    }
  }
  return true;
}

//checks for valid address
function addressValid(size){
  if(size>mainMemorySize){
    return false;
  }
  return true;
}


//checks if fields are empty
function isEmpty(input){
  //console.log(input.val());
  if(input.val().length==0){
    return true;
  }
  return false;
}


//PAGE FUNCTIONS

function drawPageTables(){
  $("#pageTables").empty();
  for(var i=0; i<pageTableArray.length; i++){
    var pageTablePanel = document.createElement("div");
    pageTablePanel.className = "pageTablePanel";
    pageTablePanel.idName="pageTablePanel"+i;
    
    //headers
    var header = document.createElement("div");
    header.className = "header";
    header.appendChild(document.createTextNode("Page Table"));
    pageTablePanel.appendChild(header);
    var memSizeHeader=document.createElement("div");
    memSizeHeader.className="header2";
    memSizeHeader.appendChild(document.createTextNode("Process ID: "+pageTableArray[i][0]));
    pageTablePanel.appendChild(memSizeHeader);
    
    //Page table contents
    var table = document.createElement("table");
    table.className = "table";
    table.idName="pageTable"+i;

    // Names of columns
    var thead = document.createElement("thead");
    var tr = document.createElement("tr");
    //Page Number column 
    var pageNumColumn = document.createElement("th");
    pageNumColumn.appendChild(document.createTextNode("Page Number"));
    tr.appendChild(pageNumColumn);
    // frame column 
    var frameColumn = document.createElement("th");
    frameColumn.appendChild(document.createTextNode("Frame Number"));
    tr.appendChild(frameColumn);
    
    thead.appendChild(tr);
    table.appendChild(thead);
  
  
  for(j=1; j<pageTableArray[i].length; j++){
    var row=document.createElement("tr");
    row.setAttribute("id", "pageRow"+pageTableArray[i][0]+(j-1));
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(j-1));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(pageTableArray[i][j]));
    
    row.appendChild(elem0);
    row.appendChild(elem1);
    table.appendChild(row);
  }
  
        
  pageTablePanel.appendChild(table);
  document.getElementById("pageTables").appendChild(pageTablePanel);
  }
    
}

function findExit(instrTable){
  exitPoints=[];
  var last;
  for(var i=0; i<backingStoreArray.length; i++){
    var last;
    for(var j=0; j<instrTable.length;j++){
      if(instrTable[j][0]==backingStoreArray[i][0]){
        last=j;
      }
    }
    exitPoints.push([backingStoreArray[i][0], last+1]);
  }
 
}

function findNumPages(procSize){
  return Math.ceil(procSize/pageSize);
}

function findPageNum(procSize){
  return Math.floor(procSize/pageSize);
}

function pidExists(table, pid, offset){
  for (var i = 0; i <table.length; i++) {
    if(table[i][0]==pid && offset<=table[i][1]){
      return true;
    }
  }
  return false;
}

function pageExists(table, pid, page){
  for (var i = 0; i <table.length; i++) {
    if(table[i][0]==pid && table[i][1]==page){
      return true;
    }
  }
  return false;
}

function generatePageTables(){
  pageTableArray=[];
  for(var i=0; i<backingStoreArray.length; i++){
    pageTableArray.push([backingStoreArray[i][0]]);
    for(var j=0; j<backingStoreArray[i][2]; j++){
      pageTableArray[i].push("Backing Store");
    }
  }
}

function generateMainMemory(numFrames){
  mainMemoryArray=["FREE"];
  for(var i=0; i<numFrames-1; i++){
    mainMemoryArray.push("FREE");
  }
}

function findPageTable(pid){
  for(var i=0; i<pageTableArray.length; i++){
    if(pageTableArray[i][0]==pid){
      return i;
    }
  }
}


function deleteRow(arr, row) {
   arr = arr.slice(0); 
   arr.splice(row, 1);
   return arr;
}

function removePageFromMem(pid, page){
  var proc=findPageTable(pid);
  var frameNum=pageTableArray[proc][page+1];
  pageTableArray[proc][page+1]="Backing Store";
  mainMemoryArray[frameNum]="FREE";  
  for(var i=0; i<algorithmArray.length; i++){
    if(algorithmArray[i][0]==pid && algorithmArray[i][1]==page &&algorithm!="Least Frequently Used"){
      algorithmArray=deleteRow(algorithmArray, i);
      break;
    }
  }
  
  drawPageTables();
}

function removeProcessFromMem(pid){
  var pr=findPageTable(pid);
  for(var z=0; z<pageTableArray[pr].length-1;z++){
    if(pageTableArray[pr][z+1]!="Backing Store"){
      removePageFromMem(pid,z);
    }
    
  }
}
  


function loadPageToMem(pid, page){
  var full=true;
  var frameToUse;
  for(var i=0; i<mainMemoryArray.length; i++){
    if(mainMemoryArray[i]=="FREE"){
      full=false;
      pageLoading(pid, page, i);
      break;
    }
  }
  //console.log(pageTableArray)
  if(full){
    var ind=findPageToSwap();
    removePageFromMem(algorithmArray[ind][0], algorithmArray[ind][1]);
    for(var i=0; i<mainMemoryArray.length; i++){
      if(mainMemoryArray[i]=="FREE"){
        pageLoading(pid, page, i);
        break;
      }
    }
  }
  drawPageTables();
  //console.log(algorithmArray);
}

function pageLoading(pid, page, frameNum){
  
  var proc=findPageTable(pid);
  pageTableArray[proc][page+1]=frameNum;
  mainMemoryArray[frameNum]=pid+String(page);
  if(algorithm=="FIFO" || algorithm=="Least Recently Used"){
    algorithmArray.push([pid, page, counter]);
  }else if(algorithm=="Least Frequently Used"){
    algorithmArray.push([pid, page, 0]);
  }
}

function findPageToSwap(){
  
    var first=9999;
    var firstIndex;
    for(var j=0; j<algorithmArray.length; j++){
      if(first>algorithmArray[j][2]){
        first=algorithmArray[j][2];
        firstIndex=j;
      }
    }
    return firstIndex;
  
}

