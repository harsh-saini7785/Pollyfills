Array.prototype.myMap = function(cb){
    const result = [];
    for(let i = 0; i< this.length; i++){
      result[i] = cb(this[i], i, this)
    }
    return result;
  }
  
  
  const arr = [1, 2, 3, 4, 5];
  
  const ans = arr.myMap((item, idx, arr)=>{
    if(idx === 2){
      return item * 10
    }else{
      return item
    }
  })

  console.log(ans, 'ans')