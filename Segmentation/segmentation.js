var mainMemorySize = 1024;


var mainMemoryArray = [["FREE", "-", 0, mainMemorySize-1]];
var instructionArray=[[]];
var segmentTableArray=[];

var allocationPolicy;

var memAccesses=0;

var processList=[];
var entryExitPoints=[];


$(document).ready(function() {
      
     // $("#runNextInstruction").hide();
 
 
      drawMainMemory();
      drawData();
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
    proc:processList,
  };
  
  
  
  var file="text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
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
      fileText=JSON.parse(fileContents);
      processList=fileText.proc;
      instructionArray=fileText.inst;
      findEntryExit(instructionArray);
      resetAll();
    }  
  }
}

function loadExample1(){
  instructionArray=[["C",0,20], ["B",1,150], ["C",1,15], ["C",2,120], ["B",1,5],["A",1,120],["B",0,45], ["A",0,45] ];
  processList=[["A",[200,125,75]],["B",[75,150]], ["C",[50,100,150]]];
  findEntryExit(instructionArray);
  resetAll();
}

function loadExample2(){
  instructionArray=[["B",1,150],["B",1,200],["A",1,120],["B",0,45], ["A",0,45]];
  processList=[["A",[200,125,75]],["B",[75,150]]];
  findEntryExit(instructionArray);
  resetAll();
}

function resetAll(){
  counter=0;
  prevBlock=null;
  mainMemoryArray=[["FREE", "-", 0, mainMemorySize-1]];
  segmentTableArray=[];
  memAccesses=0;
  drawInstructions();
  drawMainMemory();
  drawData();
  $("#segmentTable").empty();
  
}

function resetSim(){
  resetAll();
  if(instructionArray[0][0]==undefined){
      $("#instructions").empty();   
  }
}



function drawData(){
  $("#data").empty();
  var data=document.createElement("span");
  data.appendChild(document.createTextNode("# Memory Accesses: "));
  data.appendChild(document.createTextNode(memAccesses));
  document.getElementById("data").appendChild(data);
}

function saveSetup(){
  allocationPolicy=$("#memAllocPolicy").val();
  $("#nextInstrButton").show();
  resetSim();
  alert("Succss");
}

var counter=0;
var prevBlock;
var prevSeg;
function runInstr(){
    //console.log(counter);
  
  if(instructionArray[0].length==0){
    alert("No instructions");
  }else if(counter==instructionArray.length){      
    alert("Instructions executed successfully");
    resetAll();
    
    
  }else{
    if(counter>0){
      $("#instructionRow"+(counter-1)).removeClass("selectedInstr");
      $("#memoryRow"+prevBlock).removeClass("selectedMemory");
      
    }
    $("#instructionRow"+counter).addClass("selectedInstr");
        //console.log(counter);

        
    //check for process entry and exits
    for(var i=0;i<entryExitPoints.length;i++){
      if(counter==entryExitPoints[i][2]){
        removeProcessFromMem(entryExitPoints[i][0]);
        //console.log(segmentTableArray);
        drawMainMemory();
        break;
      }
    }
    
    for(var i=0;i<entryExitPoints.length;i++){
      if(counter==entryExitPoints[i][1]){
        loadProcessToMem(entryExitPoints[i][0]);
        //console.log(i);
        drawMainMemory();
        //console.log(segmentTableArray);
        break;
      }
    }
      
    var success=false;
    var found=false;
    //finding segment in memory
    for(var i=0; i<mainMemoryArray.length; i++){
      var procID=mainMemoryArray[i][0];
      var memorySegm=Number(mainMemoryArray[i][1]);
      //console.log(memorySegm)
      
      //finding instr seg in seg table
      if(memorySegm==instructionArray[counter][1]&&procID==instructionArray[counter][0]){
       var found=true;
       var segIndex;
       for(var k=0;k<segmentTableArray.length;k++){
         if(segmentTableArray[k][0]==procID){
           segIndex=k;
           break;
         }
       }
       
       
        //ensure instruction address is not larger than offset 
        if(instructionArray[counter][2]<=segmentTableArray[segIndex][memorySegm+1][1]){
            success=true;
            memAccesses++;
            drawData();
            $("#memoryRow"+i).addClass("selectedMemory");
            //console.log(mainMemoryArray[i][0]);
            drawSegmentTable(segIndex);            
            $("#segmentRow"+memorySegm).addClass("selectedSegment");
            prevBlock=i;
            
        }
      }
    }
    counter++;
  }
  
  if(success==false){
    
    //console.log(instructionArray[counter]);
    if(found){
      alert("Error: Offset is larger than segment");
    }else{
      alert("Error: This segment does not exist");
    }
    
    resetAll();
    
    
    
   /* setTimeout(function () { 
      resetAll();
    }, 2000);*/
     
    
    /*$("#instructionRow"+(counter-1)).removeClass("selectedInstr");
    $("#memoryRow"+prevBlock).removeClass("selectedMemory");
    $("#segmentRow"+mainMemoryArray[prevBlock][0]).removeClass("selectedSegment");
    */
  }
}


//SEGMENT TABLE
function drawSegmentTable(segIndex){
  $("#segmentTable").empty();
  var segmentTablePanel=document.createElement("div");
  segmentTablePanel.className="segmentTablePanel";
  
  //header
  
  var header = document.createElement("div");
  header.className = "header";
  header.appendChild(document.createTextNode("Segment Table"));
  segmentTablePanel.appendChild(header);
  var header2=document.createElement("div");
  header2.className="header2";
  header2.appendChild(document.createTextNode("Process: "+segmentTableArray[segIndex][0]));
  segmentTablePanel.appendChild(header2);
  
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
  
  for(var j=1; j<segmentTableArray[segIndex].length; j++){
    var row=document.createElement("tr");
    row.setAttribute("id", "segmentRow"+(j-1));
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(j-1));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(segmentTableArray[segIndex][j][0]));
    var elem2=document.createElement("td");
    elem2.appendChild(document.createTextNode(segmentTableArray[segIndex][j][1]));
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
  //pid column
  var pidColumn = document.createElement("th");
  pidColumn.appendChild(document.createTextNode("PID"));
  tr.appendChild(pidColumn);
  // Segment column 
  var segColumn = document.createElement("th");
  segColumn.appendChild(document.createTextNode("Segment Number"));
  tr.appendChild(segColumn);
  // offset column 
  var addrColumn = document.createElement("th");
  var divCentred = document.createElement("div");
  divCentred.setAttribute("style", "padding-left: 25%;");
  divCentred.appendChild(document.createTextNode("Offset"));
  addrColumn.appendChild(divCentred);
  tr.appendChild(addrColumn);
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  
  for(i=0; i<instructionArray.length; i++){
    var row=document.createElement("tr");
    row.setAttribute("id", "instructionRow"+i);
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(instructionArray[i][0]));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(instructionArray[i][1]));
    var elem2=document.createElement("td");
    elem2.appendChild(document.createTextNode(instructionArray[i][2]));
   
    row.appendChild(elem0);
    row.appendChild(elem1);
    row.appendChild(elem2);
    table.appendChild(row);
  }
  
        
  instructionsPanel.appendChild(table);
  document.getElementById("instructions").appendChild(instructionsPanel);
  
}

var numInstructions=1;
function addInstruction(){

  document.getElementById('instr'+numInstructions).innerHTML=
  "<td> <input type='text' id='pidIn"+numInstructions+"' placeholder='PID' class='form-control'/></td> <td> <input type='number' id='segNumIn"+numInstructions+"' placeholder='Segment Number' class='form-control' min='0'/></td> <td><input type='number' id='offsetIn"+numInstructions+"' placeholder='Offset' class='form-control' min='0'/></td>";
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
   var error=false;
   
  //check that all fields are filled in 
  $('#instructionsTable tr').each(function(){
    $(this).find('td input').each(function(){
        if(isEmpty($(this)) && error==false){
          //console.log(this);
          alert("Fields left empty");
          error=true;   
          return;         
        }
    })
  });
  
  var tempTable=[[]];
  if(error==false){
    for(var i=0; i<numInstructions; i++){
      var pid=($("#pidIn"+i).val().toUpperCase());
      var segNumber=Number($("#segNumIn"+i).val());
      
     //console.log(i+" "+segNum);
      var offset=Number($("#offsetIn"+i).val());
      tempTable[i]=[pid, segNumber,offset];
      
    }
  }
  
  //check that address is valid
  if(error==false){
    for(var i=0; i<tempTable.length;i++){
    var currentOffset=tempTable[i][2];
      if(currentOffset>=mainMemorySize || currentOffset<0){
        alert("Error: One or more offsets not valid");
        error=true;
      }
    }
   // $("#runNextInstruction").show();
  }	
  
  if(error==false&&!nameValid(tempTable)){
    error=true;
    alert("Error: PID cannot be 'free'");
  }
  
  //console.log(tempTable);
  if(error==false && !findEntryExit(tempTable)){
    error=true;
    alert("Error: One or more of these processes do not exist");
  }
  //console.log("entryext");
  //console.log(entryExitPoints);
  
  if(error==false){
     resetAll();
  for(var i = 0; i < tempTable.length; i++)
    instructionArray[i] = tempTable[i].slice();
  drawInstructions();
  tempTable=[[]];
    //console.log(ln);
   //console.log(tempTable);
  }
  
}



//MAIN MEMORY FUNCTIONS

function drawMainMemory(){
  $("#mainMemory").empty();
  var mainMemoryPanel = document.createElement("div");
  mainMemoryPanel.className = "mainMemoryPanel";
  
  //headers
  var header = document.createElement("div");
  header.className = "header";
  header.appendChild(document.createTextNode("Physical Memory"));
  mainMemoryPanel.appendChild(header);
  var header2=document.createElement("div");
  header2.className="header2";
  header2.appendChild(document.createTextNode("Size: "+mainMemorySize));
  mainMemoryPanel.appendChild(header2);
  // Main memory table
  var table = document.createElement("table");
  table.className = "table";
  // Names of columns
  var thead = document.createElement("thead");
  var tr = document.createElement("tr");
  //PID column
  var pidColumn = document.createElement("th");
  pidColumn.appendChild(document.createTextNode("PID"));
  tr.appendChild(pidColumn);
  // Segment column 
  var segmColumn = document.createElement("th");
  segmColumn.appendChild(document.createTextNode("Segment Number"));
  tr.appendChild(segmColumn);
  // Start column 
  var startColumn = document.createElement("th");
  startColumn.appendChild(document.createTextNode("Start Address"));
  tr.appendChild(startColumn);
  // End column 
  var endColumn = document.createElement("th");
  endColumn.appendChild(document.createTextNode("End Address"));
  tr.appendChild(endColumn);
  //Size column
  var sizeColumn=document.createElement("th");
  sizeColumn.appendChild(document.createTextNode("Size"));
  tr.appendChild(sizeColumn);
  
  thead.appendChild(tr);
  table.appendChild(thead);
  
  
  for(i=0; i<mainMemoryArray.length; i++){
    var row=document.createElement("tr");
    row.setAttribute("id", "memoryRow"+i);
    var elem0=document.createElement("td");
    elem0.appendChild(document.createTextNode(mainMemoryArray[i][0]));
    var elem1=document.createElement("td");
    elem1.appendChild(document.createTextNode(mainMemoryArray[i][1]));
    var elem2=document.createElement("td");
    elem2.appendChild(document.createTextNode(mainMemoryArray[i][2]));
    var elem3=document.createElement("td");
    elem3.appendChild(document.createTextNode(mainMemoryArray[i][3]));
    var elem4=document.createElement("td");
    elem4.appendChild(document.createTextNode(mainMemoryArray[i][3]-mainMemoryArray[i][2]+1));
    
    row.appendChild(elem0);
    row.appendChild(elem1);
    row.appendChild(elem2);
    row.appendChild(elem3);
    row.appendChild(elem4);
    table.appendChild(row);
  }
  
        
  mainMemoryPanel.appendChild(table);
  document.getElementById("mainMemory").appendChild(mainMemoryPanel);
  

}


var numProcesses=1;
function addProcess(){
    document.getElementById('process'+numProcesses).innerHTML=
    "<td><input type='text' id='pid"+numProcesses+"' placeholder='PID' class='form-control'/></td> <td><input type='text' id='segments"+numProcesses+"' placeholder='End Address' class='form-control' min='0'/></td>";
    //document.getElementById("process"+numProcesses).after(<tr id='process"+(numProcesses+1)+ "'></tr>);
    numProcesses++;
    $("#physicalMemoryTable").find("tbody").append($("<tr id='process"+(numProcesses)+ "'></tr>"));
  
  //console.log(numProcesses);
}

function removeProcess(){
  if(numProcesses>1){
    
    $('#process'+(numProcesses)).remove();
    $('#process'+(numProcesses-1)).empty();
    numProcesses--;
  } 
}

function saveProcesses(){

   var error=false;
  //check that all fields are filled in 
  $('#physicalMemoryTable tr').each(function(){
    $(this).find('td input').each(function(){
        if(isEmpty($(this)) && error==false){
          //console.log(this);
          alert("Fields left empty");
          error=true;   
          return;         
        }
    })
  });
  
  var tempTable=[[]];
  if(error==false){
    for(var i=0; i<numProcesses; i++){
      var pid=$("#pid"+i).val().toUpperCase();
      var segments=$("#segments"+i).val();
      var stringArr=segments.split(",");
      //console.log(stringArr);
      var intArr=[];
      for(var j=0; j<stringArr.length;j++){
        if(isNaN(stringArr[j])){
          alert("Error: Non-numeric characters found");
          error=true;
          break;
        }else{
          if(stringArr[j]!="") intArr[j]=parseInt(stringArr[j], 10);
        }
      }
      tempTable[i]=[pid,intArr];
    }
    //console.log(tempTable);
  }
  
  //check that address is valid
  if(error==false){
    for(var i=0; i<tempTable.length;i++){
      
     //console.log(tempTable[i][1]);
     //console.log(tempTable[i][2]);
      if(!segmentSizesValid(tempTable[i][1])){
        alert("Error: A process' total segment sizes exceed size of memory");
        error=true;
        break;
      }
    }
  }	
  
  //checks pid not free
  if(error==false&&(!nameValid(tempTable)||!noDuplicates(tempTable))){
    error=true;
    alert("PID cannot be 'free' or  duplicated");
  }
  
  
  if(error==false){
   
    processList[0]=[tempTable[0][0], tempTable[0][1]];
    for(var i=1; i<tempTable.length; i++){
      processList.push([tempTable[i][0], tempTable[i][1]]);       
    }
    resetAll();
    if(!(instructionArray==[[]])){
      $("#instructions").empty();   
    }else{
      drawInstructions();
    }
    alert("Success");
    //console.log("processlist")
    //console.log(processList);
  
    /*
    
    var ln = tempTable.length;
    var tempTable2=[[]];

    segmentTableArray[0]=[tempTable[0][1], tempTable[0][2]];
    
    for(var i=1; i<ln; i++){
      segmentTableArray.push([tempTable[i][1], tempTable[i][2]]);    
    }
   // console.log(tempTable2);

    for(var x=0; x<segmentTableArray.length; x++){
      segmentTableArray[x][1]=segmentTableArray[x][1]-segmentTableArray[x][0];
    }
    //console.log(segmentTableArray);

    tempTable.sort(function(a,b){
      return a[1]-b[1];
    })
    
    tempTable2[0]=[tempTable[0][1], tempTable[0][2]];
    for(var i=1; i<ln; i++){
      tempTable2.push([tempTable[i][1], tempTable[i][2]]);       
    }
    
    //add free spaces
    if(tempTable[0][1]!=0){
      tempTable.push(["free", 0, tempTable[0][1]-1]);
    }
    if(tempTable[ln-1][2]!=mainMemorySize-1){
      tempTable.push(["free", tempTable[ln-1][2]+1, mainMemorySize-1]);
    }
    //console.log(tempTable2);
    if(tempTable2.length>1){
      for(var i=0; i<tempTable2.length-1;i++){
        var low=tempTable2[i][1];
        var high=tempTable2[i+1][0];
       
        
        
        if(high!=low+1){
          tempTable.push(["free", low+1, high-1]);
          //console.log(tempTable);
          //i++;
        }
        //if(tempTable[i][2]!=tempTable[i+1][1]+1){
        //  tempTable.push(["free", tempTable[i][2]+1, tempTable[i+1][1]-1]);
          //console.log(i+" " +tempTable[i][2]+1 + " " + tempTable[i+1][1]-1);
        //}
      }
    }
    
    tempTable.sort(function(a,b){
      return a[1]-b[1];
    })
    */
    
    
    
    //console.log(ln);
    //console.log(tempTable);
    
  }
  
  //console.log($("#name0").val().length);
}

//checks for overlaps in memory table
function overlapsCheck(table){
  if(table.length==1){
    return false;

  }else{
    for(var k=1; k<table.length;i=k++){
      var start=table[k][1];
      var end=table[k][2];
      for(var j=k-1;j>=0; j--){
        if((table[j][1]<=start&&start<=table[j][2]) || (table[j][1]<=end&&end<=table[j][2])){
          return true;
        }
      }
    }
  }
  return false;
}

//checks for valid address
function segmentSizesValid(segments){
  var totsize=0;
  for(var j=0; j<segments.length; j++){
    totsize+=segments[j];
  }
  if(totsize>mainMemorySize){
    return false;
  }else{
    return true;
  }
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

//check for no duplicate names
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



//checks if fields are empty
function isEmpty(input){
  //console.log(input.val());
  if(input.val().length==0){
    return true;
  }
  return false;
}

function findEntryExit(instrTable){
  entryExitPoints=[];
  var reversedTable = instrTable.slice().reverse();
  
  
  //find first
  //find last
  for(var i=0; i<instrTable.length; i++){
    //check if already found
    if(!pidExists(entryExitPoints, instrTable[i][0])){
      //check if pid exists
      if(!pidExists(processList, instrTable[i][0])){
        return false;
      }else{
        //find first
        var first=i;
        var last;
        //find last
        for(var j=0; j<instrTable.length;j++){
          if(reversedTable[j][0]==instrTable[i][0]){
            last=instrTable.length-j-1;
            break;
          }
        }
        entryExitPoints.push([instrTable[i][0], first, last+1]);
      }
    }
  }
  return true;
}

function pidExists(table, val){
  for (var i = 0; i <table.length; i++) {
    if(table[i][0]==val){
      return true;
    }
  }
  return false;
}



function loadProcessToMem(pid){
  var proc;
  var segments=[];
  //find process and get segments
  for(var q=0;q<processList.length;q++){
    if(processList[q][0]==pid){
      proc=q;
      segments=processList[q][1];
      break;
    }
  }
  //console.log(segmentTableArray);
  //add new row to seg table array
  segmentTableArray.push([pid]);
  //console.log(segmentTableArray);
  
  //insert each segment
  for(var s=0; s<segments.length; s++){
    var segmSize=segments[s];
    //first fit
    if(allocationPolicy=="First Fit"){
      for(var q=0; q<mainMemoryArray.length;q++){
        var chunkSize=mainMemoryArray[q][3]-mainMemoryArray[q][2]+1;
        
        if(mainMemoryArray[q][0]=="FREE" &&chunkSize>=segmSize){
          if(chunkSize==segmSize){
            mainMemoryArray[q][0]=pid;
            mainMemoryArray[q][1]=s;
          }else{
            mainMemoryArray[q][0]=pid;
            mainMemoryArray[q][1]=s;
            var freeStart=segmSize+mainMemoryArray[q][2];
            var freeEnd=mainMemoryArray[q][3];
            mainMemoryArray[q][3]=freeStart-1;
            mainMemoryArray.push(["FREE", "-", freeStart, freeEnd]);
            mainMemoryArray.sort(function(a,b){
              return a[2]-b[2];
            })
          }
          segmentTableArray[segmentTableArray.length-1].push([mainMemoryArray[q][2], segmSize]);
          //console.log(segmentTableArray[segmentTableArray.length-1]);
          break;
        }
      }
      //best fit
    }else if(allocationPolicy=="Best Fit"){    
      var smallest=9999;
      var smallestSize=mainMemorySize+1;
      for(var q=0; q<mainMemoryArray.length;q++){
        var chunkSize=mainMemoryArray[q][3]-mainMemoryArray[q][2]+1;
        if(mainMemoryArray[q][0]=="FREE"&&smallestSize>chunkSize && segmSize<=chunkSize ){
          smallestSize=chunkSize;
          smallest=q;
        }
      }
      
      if(smallestSize==segmSize){
        mainMemoryArray[smallest][0]=pid;
        mainMemoryArray[smallest][1]=s;
      }else{
        mainMemoryArray[smallest][0]=pid;
        mainMemoryArray[smallest][1]=s;
        var freeStart=segmSize+mainMemoryArray[smallest][2];
        var freeEnd=mainMemoryArray[smallest][3];
        mainMemoryArray[smallest][3]=freeStart-1;
        mainMemoryArray.push(["FREE", "-", freeStart, freeEnd]);
        mainMemoryArray.sort(function(a,b){
          return a[2]-b[2];
        })
      }
      segmentTableArray[segmentTableArray.length-1].push([mainMemoryArray[smallest][2], segmSize]);
      //console.log(segmentTableArray);
      
      //worst fit
    }else if(allocationPolicy=="Worst Fit"){
      var largest=9999;
      var largestSize=0;
      for(var q=0; q<mainMemoryArray.length;q++){
        var chunkSize=mainMemoryArray[q][3]-mainMemoryArray[q][2]+1;
        if(mainMemoryArray[q][0]=="FREE"&&largestSize<chunkSize && segmSize<=chunkSize){
          largestSize=chunkSize;
          largest=q;
        }
      }
      
      if(largestSize==segmSize){
        mainMemoryArray[largest][0]=pid;
        mainMemoryArray[largest][1]=s;
      }else{
        mainMemoryArray[largest][0]=pid;
        mainMemoryArray[largest][1]=s;
        var freeStart=segmSize+mainMemoryArray[largest][2];
        var freeEnd=mainMemoryArray[largest][3];
        mainMemoryArray[largest][3]=freeStart-1;
        mainMemoryArray.push(["FREE", "-", freeStart, freeEnd]);
        mainMemoryArray.sort(function(a,b){
          return a[2]-b[2];
        })
      }
      segmentTableArray[segmentTableArray.length-1].push([mainMemoryArray[largest][2], segmSize]);
    }
  }
  
}

function removeProcessFromMem(pid){
  var before=false;
  var after=false;
  var start, end;
  for(var p=0; p<mainMemoryArray.length; p++){
    if(mainMemoryArray[p][0]==pid){
      //check for empty space before
      if(p>0){
        if(mainMemoryArray[p-1][0]=="FREE"){
          before=true;
        }
      }
      if(p<mainMemoryArray.length-1){
        if(mainMemoryArray[p+1][0]=="FREE"){
          after=true;
        }
      }
    
      
      if(before&&after){
        start=mainMemoryArray[p-1][2];
        end=mainMemoryArray[p+1][3];
        mainMemoryArray=deleteRow(mainMemoryArray, p+1);
        mainMemoryArray=deleteRow(mainMemoryArray, p);
        p--;
        
      }else if(after&&!before){
        start=mainMemoryArray[p][2];
        end=mainMemoryArray[p+1][3];
        mainMemoryArray=deleteRow(mainMemoryArray, p+1);
      }else if(before&&!after){
        start=mainMemoryArray[p-1][2];
        end=mainMemoryArray[p][3];
        mainMemoryArray=deleteRow(mainMemoryArray, p);
        p--;
      }else{
        start=mainMemoryArray[p][2];
        end=mainMemoryArray[p][3];
      }
      mainMemoryArray[p]=["FREE", "-", start, end];
      
    }
  }
  
  for(var p=0;p<segmentTableArray.length;p++){
    if(segmentTableArray[p][0]==pid)
      segmentTableArray=deleteRow(segmentTableArray, p);
  }
  
}

function deleteRow(arr, row) {
   arr = arr.slice(0); 
   arr.splice(row, 1);
   return arr;
}

